import logging
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.suggestions import (
    get_suggestions,
    is_requesty_configured,
    validate_request,
    InvalidSuggestionRequest,
    _is_transient_error,
    _is_auth_error,
    _get_model_priority,
    REQUESTY_MODEL_PRIORITY,
    MAX_WORDS,
    MAX_WORD_LENGTH,
)


def test_returns_local_fallback_for_known_word():
    result = get_suggestions(["help"])
    assert "I need help" in result


def test_returns_joined_words_for_unknown_input():
    result = get_suggestions(["purple", "elephant"])
    assert result == ["purple elephant"]


def test_requesty_not_configured_without_env_key(monkeypatch):
    monkeypatch.delenv("REQUESTY_API_KEY", raising=False)
    assert is_requesty_configured() is False


# --- Input validation ---------------------------------------------------


def test_rejects_empty_word_list():
    with pytest.raises(InvalidSuggestionRequest):
        validate_request([], "en")


def test_rejects_oversized_word_list():
    words = [f"word{i}" for i in range(MAX_WORDS + 1)]
    with pytest.raises(InvalidSuggestionRequest):
        validate_request(words, "en")


def test_accepts_word_list_at_max_size():
    words = [f"w{i}" for i in range(MAX_WORDS)]
    validate_request(words, "en")  # should not raise


def test_rejects_unsupported_language():
    with pytest.raises(InvalidSuggestionRequest):
        validate_request(["help"], "fr")


def test_rejects_empty_string_word():
    with pytest.raises(InvalidSuggestionRequest):
        validate_request(["help", "   "], "en")


def test_get_suggestions_raises_for_empty_input():
    with pytest.raises(InvalidSuggestionRequest):
        get_suggestions([], "en")


def test_get_suggestions_raises_for_bad_language():
    with pytest.raises(InvalidSuggestionRequest):
        get_suggestions(["help"], "de")


def test_rejects_landmark_like_oversized_word():
    """A word field stuffed with a huge numeric-array-like or base64-looking
    string must be rejected by validation, the schema should make raw
    landmark/video data structurally impossible to send through here."""
    fake_landmark_blob = ",".join(str(i * 0.0001) for i in range(5000))
    with pytest.raises(InvalidSuggestionRequest):
        validate_request([fake_landmark_blob], "en")


def test_rejects_many_short_landmark_like_fields():
    """Even if someone tried to split a landmark array across many list
    entries, the max-word-count limit still rejects it."""
    fake_coords = [str(i * 0.001) for i in range(5000)]
    with pytest.raises(InvalidSuggestionRequest):
        validate_request(fake_coords, "en")


# --- Fallback-trigger classification ------------------------------------


class _FakeStatusError(Exception):
    def __init__(self, status_code):
        super().__init__("fake error")
        self.status_code = status_code


def test_5xx_is_transient():
    assert _is_transient_error(_FakeStatusError(500)) is True
    assert _is_transient_error(_FakeStatusError(503)) is True


def test_429_rate_limit_is_transient():
    assert _is_transient_error(_FakeStatusError(429)) is True


def test_401_403_are_not_transient():
    assert _is_transient_error(_FakeStatusError(401)) is False
    assert _is_transient_error(_FakeStatusError(403)) is False


def test_401_403_are_auth_errors():
    assert _is_auth_error(_FakeStatusError(401)) is True
    assert _is_auth_error(_FakeStatusError(403)) is True


def test_400_is_not_transient_and_not_auth():
    err = _FakeStatusError(400)
    assert _is_transient_error(err) is False
    assert _is_auth_error(err) is False


def test_model_unavailable_message_is_transient():
    assert _is_transient_error(RuntimeError("model not found: foo")) is True
    assert _is_transient_error(RuntimeError("the requested model is unavailable")) is True


def test_model_no_longer_available_message_is_transient():
    """Regression: Requesty's real wording for a retired model is 'is no
    longer available', which does not contain the substring 'unavailable'.
    A real request against Requesty's live router surfaced this exact
    message and crashed with an unhandled 500 before this case was added."""
    err = RuntimeError(
        'Error code: 404 - {\'error\': {\'message\': \'The requested model '
        '"nvidia/nemotron-3-super-120b-a12b" is no longer available. Pick '
        "another model from https://app.requesty.ai/model-library'}}"
    )
    assert _is_transient_error(err) is True


def test_invalid_model_message_is_transient():
    """Regression: Requesty's router can rewrite a model name internally
    (e.g. 'mistral/leanstral-1-5' surfaced back as 'labs-leanstral-1-5')
    and reject it as unrecognized with a 400. A real request crashed with
    an unhandled 500 before this case was added, since '400' is not in
    the transient status-code list and the message didn't match any of
    the other model-unavailable phrasings."""
    err = RuntimeError(
        "Error code: 400 - {'error': {'origin': 'provider', 'message': "
        "'Invalid model: labs-leanstral-1-5'}}"
    )
    assert _is_transient_error(err) is True


def test_model_not_approved_for_key_is_transient_not_auth():
    """Regression: Requesty returns a real 403 when a specific model is not
    on this key's approved list, not when the key itself is invalid. This
    must be skipped like any other unavailable model, not raised as a fatal
    RequestyAuthError that aborts the whole fallback chain early."""

    class _FakeForbidden(Exception):
        status_code = 403

    err = _FakeForbidden(
        "Error code: 403 - {'error': {'message': 'The requested model is "
        "not approved for this API key. An org or group admin can approve "
        "it in the Model Library'}}"
    )
    assert _is_transient_error(err) is True
    assert _is_auth_error(err) is False


def test_generic_value_error_is_not_transient():
    assert _is_transient_error(ValueError("bad request: missing field")) is False


def test_model_priority_list_preserved_verbatim():
    assert REQUESTY_MODEL_PRIORITY == [
        "nvidia/nemotron-3-super-120b-a12b",
        "google/gemma-4-31b-it",
        "nvidia/nemotron-3.5-lightning-30b-a3b",
        "novita/ling-3.1-flash",
        "mistral/leanstral-1-5",
        "nvidia/muse-glimmer-30b",
        "novita/inclusionai/ling-3.0-tiny",
    ]


def test_model_priority_bounded(monkeypatch):
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)
    order = _get_model_priority()
    # Bounded to the full priority list: a dead or empty-responding model
    # earlier in the list must never block reaching a working one later in
    # it, so every configured model gets one real attempt.
    assert len(order) == len(REQUESTY_MODEL_PRIORITY)
    assert order[0] == REQUESTY_MODEL_PRIORITY[0]


def test_model_priority_prefers_configured_model(monkeypatch):
    monkeypatch.setenv("REQUESTY_MODEL", "google/gemma-4-31b-it")
    order = _get_model_priority()
    assert order[0] == "google/gemma-4-31b-it"


# --- Sanitized logging ----------------------------------------------------


def test_logging_never_includes_confirmed_word_content(caplog):
    """Running get_suggestions should never leak the actual confirmed word
    text into log output, only operational metadata."""
    secret_word = "supersecretmedicalcondition"
    with caplog.at_level(logging.INFO):
        get_suggestions([secret_word], "en")
    for record in caplog.records:
        assert secret_word not in record.getMessage()


class _FakeMessage:
    def __init__(self, content):
        self.content = content


class _FakeChoice:
    def __init__(self, content):
        self.message = _FakeMessage(content)


class _FakeResponse:
    def __init__(self, content):
        self.choices = [_FakeChoice(content)]


class _FakeChatCompletions:
    def __init__(self, responses_or_exceptions):
        # A list consumed in order, one entry per call to .create(...).
        self._queue = list(responses_or_exceptions)

    def create(self, **kwargs):
        item = self._queue.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


class _FakeChat:
    def __init__(self, completions):
        self.completions = completions


class _FakeOpenAIClient:
    def __init__(self, responses_or_exceptions, **kwargs):
        self.chat = _FakeChat(_FakeChatCompletions(responses_or_exceptions))


def test_call_requesty_returns_lines_on_mocked_success(monkeypatch):
    """Mocks the OpenAI SDK client entirely, no real network call. Verifies
    the happy path parses a successful provider response into a list of
    suggestion lines."""
    import app.suggestions as suggestions_module

    monkeypatch.setenv("REQUESTY_API_KEY", "fake-key-for-test")
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)

    fake_client = _FakeOpenAIClient([_FakeResponse("I need help\nPlease help me")])
    monkeypatch.setattr(
        suggestions_module,
        "OpenAI",
        lambda **kwargs: fake_client,
        raising=False,
    )
    # _call_requesty imports OpenAI lazily inside the function body, so patch
    # the module that import resolves to instead.
    import openai as openai_module

    monkeypatch.setattr(openai_module, "OpenAI", lambda **kwargs: fake_client)

    result = suggestions_module._call_requesty(["help"], "en")
    assert result == ["I need help", "Please help me"]


def test_call_requesty_cycles_on_transient_then_succeeds(monkeypatch):
    """First model attempt raises a transient (5xx-like) error, second
    attempt in the priority list succeeds. Confirms fallback cycling works
    against a fully mocked client, no real HTTP call."""
    import app.suggestions as suggestions_module

    monkeypatch.setenv("REQUESTY_API_KEY", "fake-key-for-test")
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)

    class _TransientError(Exception):
        status_code = 503

    fake_client = _FakeOpenAIClient([_TransientError("server busy"), _FakeResponse("Thank you so much")])
    import openai as openai_module

    monkeypatch.setattr(openai_module, "OpenAI", lambda **kwargs: fake_client)

    result = suggestions_module._call_requesty(["thank you"], "en")
    assert result == ["Thank you so much"]


def test_call_requesty_raises_auth_error_immediately_without_cycling(monkeypatch):
    """A 401 on the first attempt must raise RequestyAuthError right away,
    it must never be swallowed into a fallback or retried against the next
    model in the priority list."""
    import app.suggestions as suggestions_module

    monkeypatch.setenv("REQUESTY_API_KEY", "fake-key-for-test")
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)

    class _AuthError(Exception):
        status_code = 401

    # Only one item queued: if the code tried to cycle to a second model,
    # popping from an empty queue would raise IndexError instead of
    # RequestyAuthError, so this also proves no retry happened.
    fake_client = _FakeOpenAIClient([_AuthError("bad key")])
    import openai as openai_module

    monkeypatch.setattr(openai_module, "OpenAI", lambda **kwargs: fake_client)

    with pytest.raises(suggestions_module.RequestyAuthError):
        suggestions_module._call_requesty(["help"], "en")


def test_call_requesty_returns_none_when_response_has_empty_content(monkeypatch):
    """A malformed/empty provider response (no usable text) must not crash,
    it should be treated as a failed attempt so the caller falls back."""
    import app.suggestions as suggestions_module

    monkeypatch.setenv("REQUESTY_API_KEY", "fake-key-for-test")
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)

    empty_responses = [_FakeResponse("") for _ in REQUESTY_MODEL_PRIORITY]
    fake_client = _FakeOpenAIClient(empty_responses)
    import openai as openai_module

    monkeypatch.setattr(openai_module, "OpenAI", lambda **kwargs: fake_client)

    result = suggestions_module._call_requesty(["help"], "en")
    assert result is None


def test_get_suggestions_falls_back_locally_when_requesty_exhausts_transient_failures(monkeypatch):
    """End-to-end: with a key configured but every provider attempt failing
    transiently (mocked), get_suggestions must still return the local
    curated fallback rather than raising or returning nothing."""
    import app.suggestions as suggestions_module

    monkeypatch.setenv("REQUESTY_API_KEY", "fake-key-for-test")
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)

    class _TransientError(Exception):
        status_code = 500

    transient_errors = [_TransientError("x") for _ in REQUESTY_MODEL_PRIORITY]
    fake_client = _FakeOpenAIClient(transient_errors)
    import openai as openai_module

    monkeypatch.setattr(openai_module, "OpenAI", lambda **kwargs: fake_client)

    result = suggestions_module.get_suggestions(["help"], "en")
    assert "I need help" in result


def test_get_suggestions_falls_back_locally_on_an_unclassified_requesty_exception(monkeypatch):
    """Regression: a Requesty failure that is neither transient nor an auth
    error (a brand-new, unanticipated error shape) must still fall back to
    the local curated list, not crash the request. _call_requesty re-raises
    immediately on a non-transient, non-auth exception, so get_suggestions
    itself must catch it rather than letting it propagate uncaught."""
    import app.suggestions as suggestions_module

    monkeypatch.setenv("REQUESTY_API_KEY", "fake-key-for-test")
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)

    class _UnclassifiedError(Exception):
        pass

    fake_client = _FakeOpenAIClient([_UnclassifiedError("a completely new, unanticipated failure shape")])
    import openai as openai_module

    monkeypatch.setattr(openai_module, "OpenAI", lambda **kwargs: fake_client)

    result = suggestions_module.get_suggestions(["help"], "en")
    assert "I need help" in result


def test_call_requesty_timeout_is_treated_as_transient(monkeypatch):
    """A request timeout from the SDK must be classified as transient
    (cycles to the next model) rather than surfacing as a hard failure."""
    import app.suggestions as suggestions_module
    from openai import APITimeoutError

    monkeypatch.setenv("REQUESTY_API_KEY", "fake-key-for-test")
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)

    timeout_exc = APITimeoutError(request=None)
    fake_client = _FakeOpenAIClient([timeout_exc, _FakeResponse("I need water")])
    import openai as openai_module

    monkeypatch.setattr(openai_module, "OpenAI", lambda **kwargs: fake_client)

    result = suggestions_module._call_requesty(["water"], "en")
    assert result == ["I need water"]
    assert suggestions_module._is_transient_error(timeout_exc) is True


def test_logging_never_includes_api_key(monkeypatch, caplog):
    """Simulates a configured key with the network call itself mocked out
    (no real HTTP request), and asserts the key text never appears in logs
    even when the call path logs a failure."""
    import app.suggestions as suggestions_module

    fake_key = "rqsty-sk-totally-fake-test-key"
    monkeypatch.setenv("REQUESTY_API_KEY", fake_key)
    monkeypatch.delenv("REQUESTY_MODEL", raising=False)

    def fake_call_requesty(confirmed_words, output_language):
        # Simulate every model attempt failing transiently, without any
        # real network access, then log the way the real path does.
        suggestions_module.logger.warning(
            "requesty request failed: transient error, trying fallback model index 1"
        )
        return None

    monkeypatch.setattr(suggestions_module, "_call_requesty", fake_call_requesty)

    with caplog.at_level(logging.INFO):
        get_suggestions(["help"], "en")

    for record in caplog.records:
        assert fake_key not in record.getMessage()
