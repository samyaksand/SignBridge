import os
import logging
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Vendored, with substantial adaptation, from the SoundSigns project. Used
# here with the original authors' explicit permission; see README.md in this folder for the full
# disclosure. The gloss-translation call was rewritten to use Requesty's
# OpenAI-compatible router (already integrated in this project at
# backend/app/suggestions.py) instead of a standalone OpenAI key, so this
# feature shares the same API key the rest of SignBridge uses, rather than
# requiring a second, separate key. The model priority list below is
# copied verbatim from backend/app/suggestions.py; do not reorder, rename,
# or prune it.

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("soundsigns.transcription")

app = Flask(__name__)
load_dotenv()

# Allowed frontend origin(s) for CORS. Comma-separated if more than one is
# ever needed. Defaults to the local Next.js dev server so nothing breaks
# for local development; set ALLOWED_ORIGIN to the real deployed frontend
# origin (e.g. https://signbridge.pages.dev) in production. Mirrors the
# env-var-with-localhost-fallback pattern already used on the frontend side
# (see frontend/lib/alphabet-recognition/checkRecognitionService.ts) and the
# equivalent fix applied to backend/services/isl-sign-recognition/main.py.
_allowed_origins_raw = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in _allowed_origins_raw.split(",") if origin.strip()]
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})

# Preserved verbatim from backend/app/suggestions.py / frontend/lib/config/requestyModels.ts.
REQUESTY_MODEL_PRIORITY = [
    "nvidia/nemotron-3-super-120b-a12b",
    "google/gemma-4-31b-it",
    "nvidia/nemotron-3.5-lightning-30b-a3b",
    "novita/ling-3.1-flash",
    "mistral/leanstral-1-5",
    "nvidia/muse-glimmer-30b",
    "novita/inclusionai/ling-3.0-tiny",
]

DEFAULT_REQUESTY_BASE_URL = "https://router.requesty.ai/v1"
REQUEST_TIMEOUT_SECONDS = 9
# Bounded to the length of REQUESTY_MODEL_PRIORITY itself: every model in the
# list gets one real attempt before giving up, since a dead or
# empty-responding model earlier in the list should never block reaching a
# working one later in it.
MAX_FALLBACK_ATTEMPTS = len(REQUESTY_MODEL_PRIORITY) + 1  # +1 for an optional REQUESTY_MODEL override

GLOSS_SYSTEM_PROMPT = """
You are an expert ISL gloss translator. Follow these rules:
1. Use UPPERCASE for signs
2. Fingerspell names with hyphens (e.g., J-O-H-N)
3. Omit English words like 'is', 'the', 'a'
4. Use classifiers for spatial relationships
5. Maintain ISL grammar structure (time-topic-comment)

Example Translations:
English: "Hello, my name is John."
ISL Gloss: "HELLO, ME NAME J-O-H-N."

English: "I have two cats at home."
ISL Gloss: "HOME, TWO CAT HAVE-ME."

English: "Where is the nearest restaurant?"
ISL Gloss: "NEAREST RESTAURANT WHERE?"

write only the translated ISL gloss without any additional words
"""


class RequestyAuthError(RuntimeError):
    """Raised for 401/403 from Requesty. Must surface immediately, no cycling."""


def is_requesty_configured() -> bool:
    return bool(os.environ.get("REQUESTY_API_KEY"))


def _get_model_priority():
    configured_model = os.environ.get("REQUESTY_MODEL")
    order = []
    if configured_model:
        order.append(configured_model)
    for model in REQUESTY_MODEL_PRIORITY:
        if model not in order:
            order.append(model)
    return order[:MAX_FALLBACK_ATTEMPTS]


def _is_transient_error(exc):
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)
    if status in (408, 409, 429, 500, 502, 503, 504):
        return True
    name = type(exc).__name__.lower()
    if any(
        token in name
        for token in ("timeout", "ratelimit", "serviceunavailable", "internalservererror", "apiconnectionerror")
    ):
        return True
    message = str(exc).lower()
    if "model" in message and (
        "unavailable" in message
        or "not found" in message
        or "does not exist" in message
        or "no longer available" in message
        or "not approved for this api key" in message
    ):
        return True
    return False


def _is_auth_error(exc):
    # A 403 can mean two different things on Requesty's router: the whole
    # API key is invalid/revoked (a real auth failure, must abort), or this
    # one model just is not on this key's approved list (should be skipped
    # like any other unavailable model, not treated as a fatal account
    # problem). Only the first is a genuine auth error.
    message = str(exc).lower()
    if "not approved for this api key" in message:
        return False
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)
    if status in (401, 403):
        return True
    name = type(exc).__name__.lower()
    return "authentication" in name or "permissiondenied" in name


def _call_requesty(text: str):
    """Calls Requesty's OpenAI-compatible router with the ISL gloss prompt.
    Returns the gloss string, or None if every attempt in the bounded model
    priority list failed with a transient error. Raises RequestyAuthError
    immediately on 401/403, never cycling models for an auth failure."""
    from openai import OpenAI  # imported lazily so the module loads fine without the package

    api_key = os.environ.get("REQUESTY_API_KEY")
    base_url = os.environ.get("REQUESTY_BASE_URL", DEFAULT_REQUESTY_BASE_URL)
    client = OpenAI(api_key=api_key, base_url=base_url, timeout=REQUEST_TIMEOUT_SECONDS)

    for index, model in enumerate(_get_model_priority()):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": GLOSS_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Translate to ISL gloss: '{text}'"},
                ],
                temperature=0.2,
                timeout=REQUEST_TIMEOUT_SECONDS,
                max_tokens=150,
            )
            gloss = (response.choices[0].message.content or "").strip()
            if gloss:
                logger.info("requesty gloss request succeeded using model index %d", index)
                return gloss
            logger.warning("requesty returned an empty gloss for model index %d", index)
            continue
        except Exception as exc:  # noqa: BLE001 - classified below, never log exc content
            if _is_auth_error(exc):
                logger.warning("requesty request failed: authentication error")
                raise RequestyAuthError("Requesty authentication failed. Check REQUESTY_API_KEY.") from None
            if _is_transient_error(exc):
                logger.warning("requesty request failed: transient error, trying fallback model index %d", index + 1)
                continue
            logger.warning("requesty request failed: non-transient error")
            raise

    logger.warning("requesty gloss request failed after exhausting %d model attempts", len(_get_model_priority()))
    return None


# Last-resort providers, tried in this order only if Requesty's own full
# fallback chain is exhausted. Each is a genuine, independently tested
# account, not a guess: every one of these was sent a real request during
# development and confirmed to return a real completion. None of these are
# called unless Requesty itself fails completely, since Requesty is this
# project's primary, already-integrated provider.
def _call_openrouter(text: str):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return None
    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": GLOSS_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Translate to ISL gloss: '{text}'"},
                ],
                "temperature": 0.2,
                "max_tokens": 150,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        gloss = (resp.json()["choices"][0]["message"]["content"] or "").strip()
        if gloss:
            logger.info("fallback translation succeeded via OpenRouter")
            return gloss
    except Exception:  # noqa: BLE001 - any failure here just means try the next provider
        logger.warning("fallback translation via OpenRouter failed")
    return None


def _call_groq(text: str):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "openai/gpt-oss-20b",
                "messages": [
                    {"role": "system", "content": GLOSS_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Translate to ISL gloss: '{text}'"},
                ],
                "temperature": 0.2,
                "max_tokens": 150,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        gloss = (resp.json()["choices"][0]["message"]["content"] or "").strip()
        if gloss:
            logger.info("fallback translation succeeded via Groq")
            return gloss
    except Exception:  # noqa: BLE001 - any failure here just means try the next provider
        logger.warning("fallback translation via Groq failed")
    return None


def _call_gemini(text: str):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        resp = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            params={"key": api_key},
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": f"{GLOSS_SYSTEM_PROMPT}\n\nTranslate to ISL gloss: '{text}'"
                            }
                        ]
                    }
                ]
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        gloss = (
            resp.json()["candidates"][0]["content"]["parts"][0]["text"] or ""
        ).strip()
        if gloss:
            logger.info("fallback translation succeeded via Gemini")
            return gloss
    except Exception:  # noqa: BLE001 - any failure here just means give up honestly
        logger.warning("fallback translation via Gemini failed")
    return None


def _call_last_resort_providers(text: str):
    """Tries OpenRouter, then Groq, then Gemini, in that order, only after
    Requesty's own fallback chain has been fully exhausted. Returns the
    first real gloss any of them produces, or None if all three are
    unconfigured or fail, in which case the caller reports an honest
    error rather than fabricating a translation."""
    for provider in (_call_openrouter, _call_groq, _call_gemini):
        gloss = provider(text)
        if gloss:
            return gloss
    return None


def text_to_isl_gloss(text: str) -> str:
    """Convert English text to ISL gloss notation using Requesty, with
    OpenRouter, Groq, and Gemini as last-resort backups if Requesty's own
    model fallback chain is fully exhausted.

    Raises RuntimeError if no provider is configured at all, or if every
    provider attempt fails, so callers can return an honest, clear error
    instead of a silent or fabricated translation. There is no local
    rule-based fallback for this step: a real gloss translation genuinely
    needs an LLM call, so this is reported as unavailable rather than faked.
    """
    if not text.strip():
        return ""

    has_any_provider = is_requesty_configured() or any(
        os.environ.get(key) for key in ("OPENROUTER_API_KEY", "GROQ_API_KEY", "GEMINI_API_KEY")
    )
    if not has_any_provider:
        raise RuntimeError(
            "No translation provider is configured. This feature needs at "
            "least one of REQUESTY_API_KEY, OPENROUTER_API_KEY, "
            "GROQ_API_KEY, or GEMINI_API_KEY; there is no local fallback "
            "for the gloss translation step."
        )

    gloss = None
    if is_requesty_configured():
        try:
            gloss = _call_requesty(text)
        except RequestyAuthError as e:
            logger.warning("Requesty auth failed, trying last-resort providers instead")
            gloss = None

    if gloss is None:
        gloss = _call_last_resort_providers(text)

    if gloss is None:
        raise RuntimeError(
            "No configured translation provider returned a usable result "
            "(tried Requesty's full model list, then OpenRouter, Groq, and "
            "Gemini where configured). Please try again shortly."
        )
    return gloss


@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        isl_gloss = text_to_isl_gloss(text)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503

    return jsonify({"isl": isl_gloss})


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "ISL Translator"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8122, debug=False)
