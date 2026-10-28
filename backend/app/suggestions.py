"""
Suggestion endpoint logic.

This talks to Requesty's OpenAI-compatible router ONLY if REQUESTY_API_KEY is
set in the environment. In this build's default environment, no key is
configured, so every call uses the local curated fallback below. We never
fake a network call, if a key is present we call REQUESTY_BASE_URL with the
OpenAI Python SDK, cycling through the model priority list from
frontend/lib/config/requestyModels.ts (mirrored below for backend use) only
on transient failures.

Privacy invariant: the only data this module ever sends anywhere is a short
list of already-confirmed words and a two-letter language code. It never
receives, touches, or forwards camera frames, video, or landmark arrays,
the input schema in app/main.py makes that structurally impossible.
"""

import logging
import os
from typing import List, Literal, Optional

OutputLanguage = Literal["en", "hi"]

logger = logging.getLogger("signbridge.suggestions")

# Preserved verbatim from frontend/lib/config/requestyModels.ts. Do not
# reorder, rename, or prune, this is the agreed fallback chain.
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

MAX_WORDS = 12
MAX_WORD_LENGTH = 40
REQUEST_TIMEOUT_SECONDS = 9
MAX_FALLBACK_ATTEMPTS = 3  # bounded total attempts across the priority list

# Small local curated map from confirmed words to natural follow-on phrases.
# This is the fallback path that always runs without a REQUESTY_API_KEY.
_LOCAL_SUGGESTIONS = {
    "help": ["I need help", "Please help me", "Can you help, please?"],
    "hungry": ["I am hungry", "Can I have food, please?"],
    "water": ["I need water", "Can I have some water?"],
    "tired": ["I am tired", "I need a break"],
    "thank you": ["Thank you", "Thank you so much"],
}


class InvalidSuggestionRequest(ValueError):
    """Raised for client input errors. Callers should surface this as 4xx."""


class RequestyAuthError(RuntimeError):
    """Raised for 401/403 from Requesty. Must surface immediately, no cycling."""


def is_requesty_configured() -> bool:
    return bool(os.environ.get("REQUESTY_API_KEY"))


def _get_model_priority() -> List[str]:
    """Returns the model attempt order: REQUESTY_MODEL first if set, then the
    rest of the priority list (skipping a duplicate), bounded to
    MAX_FALLBACK_ATTEMPTS entries."""
    configured_model = os.environ.get("REQUESTY_MODEL")
    order: List[str] = []
    if configured_model:
        order.append(configured_model)
    for model in REQUESTY_MODEL_PRIORITY:
        if model not in order:
            order.append(model)
    return order[:MAX_FALLBACK_ATTEMPTS]


def validate_request(confirmed_words: List[str], output_language: str) -> None:
    """Validates input. Raises InvalidSuggestionRequest with a clear message
    on any problem. This is the single place that decides what counts as a
    well-formed request, nothing larger than a short word list, nothing
    outside the two supported languages."""
    if output_language not in ("en", "hi"):
        raise InvalidSuggestionRequest(
            f"Unsupported output_language '{output_language}'. Use 'en' or 'hi'."
        )
    if not confirmed_words:
        raise InvalidSuggestionRequest("confirmed_words must not be empty.")
    if len(confirmed_words) > MAX_WORDS:
        raise InvalidSuggestionRequest(
            f"confirmed_words must contain at most {MAX_WORDS} words, got {len(confirmed_words)}."
        )
    for word in confirmed_words:
        if not isinstance(word, str):
            raise InvalidSuggestionRequest("Each confirmed word must be a string.")
        if not word.strip():
            raise InvalidSuggestionRequest("confirmed_words must not contain empty strings.")
        if len(word) > MAX_WORD_LENGTH:
            raise InvalidSuggestionRequest(
                f"Each confirmed word must be at most {MAX_WORD_LENGTH} characters. "
                "This endpoint only accepts short confirmed word meanings, never raw "
                "landmark, video, or image data."
            )


def _local_fallback(confirmed_words: List[str], output_language: OutputLanguage) -> List[str]:
    key = confirmed_words[0].lower()
    if key in _LOCAL_SUGGESTIONS:
        return _LOCAL_SUGGESTIONS[key]
    # Generic honest fallback: just join the confirmed words.
    joined = " ".join(confirmed_words)
    return [joined]


def _is_transient_error(exc: Exception) -> bool:
    """True for errors that justify cycling to the next model: timeouts,
    5xx server errors, rate limits, or an explicit model-unavailable error.
    False for everything else, including auth failures and bad input, which
    must surface immediately instead of triggering retries."""
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)
    if status in (408, 409, 429, 500, 502, 503, 504):
        return True
    name = type(exc).__name__.lower()
    if any(token in name for token in ("timeout", "ratelimit", "serviceunavailable", "internalservererror", "apiconnectionerror")):
        return True
    message = str(exc).lower()
    if "model" in message and ("unavailable" in message or "not found" in message or "does not exist" in message):
        return True
    return False


def _is_auth_error(exc: Exception) -> bool:
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)
    if status in (401, 403):
        return True
    name = type(exc).__name__.lower()
    return "authentication" in name or "permissiondenied" in name


def _call_requesty(confirmed_words: List[str], output_language: OutputLanguage) -> Optional[List[str]]:
    """Calls Requesty's OpenAI-compatible router. Returns a list of
    suggestions, or None if every attempt in the (bounded) model priority
    list failed with a transient error. Raises RequestyAuthError immediately
    on 401/403, never cycling models for an auth failure.

    Only confirmed_words and output_language are ever sent in the prompt,
    nothing else is accepted by this function's signature.
    """
    from openai import OpenAI  # imported lazily so the module loads fine without the package

    api_key = os.environ.get("REQUESTY_API_KEY")
    base_url = os.environ.get("REQUESTY_BASE_URL", DEFAULT_REQUESTY_BASE_URL)
    client = OpenAI(api_key=api_key, base_url=base_url, timeout=REQUEST_TIMEOUT_SECONDS)

    language_name = "English" if output_language == "en" else "Hindi"
    words_joined = ", ".join(confirmed_words)
    system_prompt = (
        "You help a nonverbal child's family turn a short list of confirmed words "
        "into 2-3 natural, short, friendly sentences. Reply with ONLY the sentences, "
        "one per line, no numbering, no extra commentary."
    )
    user_prompt = f"Confirmed words: {words_joined}\nOutput language: {language_name}"

    last_error: Optional[Exception] = None
    for index, model in enumerate(_get_model_priority()):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                timeout=REQUEST_TIMEOUT_SECONDS,
                max_tokens=120,
            )
            text = (response.choices[0].message.content or "").strip()
            lines = [line.strip("- \t") for line in text.splitlines() if line.strip()]
            if lines:
                logger.info("requesty request succeeded using model index %d", index)
                return lines
            last_error = RuntimeError("empty response")
            logger.warning("requesty returned an empty response for model index %d", index)
            continue
        except Exception as exc:  # noqa: BLE001 - we classify below, never log exc content
            if _is_auth_error(exc):
                logger.warning("requesty request failed: authentication error")
                raise RequestyAuthError("Requesty authentication failed. Check REQUESTY_API_KEY.") from None
            if _is_transient_error(exc):
                logger.warning("requesty request failed: transient error, trying fallback model index %d", index + 1)
                last_error = exc
                continue
            # Non-transient, non-auth error: surface immediately, no cycling.
            logger.warning("requesty request failed: non-transient error")
            raise

    logger.warning("requesty request failed after exhausting %d model attempts", len(_get_model_priority()))
    return None


def get_suggestions(confirmed_words: List[str], output_language: OutputLanguage = "en") -> List[str]:
    """
    Returns short, friendly sentence suggestions built from confirmed words.

    Validates input first (raises InvalidSuggestionRequest on bad input).
    Uses Requesty if REQUESTY_API_KEY is configured, sending ONLY the
    confirmed words and output language, never raw video or landmarks.
    Falls back to the local curated list if no key is configured, or if
    every Requesty attempt fails transiently. Auth errors are raised, not
    swallowed into a fallback, so misconfiguration is visible.
    """
    validate_request(confirmed_words, output_language)

    if not is_requesty_configured():
        return _local_fallback(confirmed_words, output_language)

    result = _call_requesty(confirmed_words, output_language)
    if result is not None:
        return result

    logger.info("falling back to local curated suggestions after requesty attempts failed")
    return _local_fallback(confirmed_words, output_language)
