"""
HTTP-layer tests for the FastAPI app in app/main.py, using FastAPI's
TestClient (no real network, in-process ASGI calls only). These
complement test_suggestions.py, which tests app/suggestions.py directly
without going through HTTP request validation, serialization, and status
codes.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_reports_requesty_configuration_state(monkeypatch):
    monkeypatch.delenv("REQUESTY_API_KEY", raising=False)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["requesty_configured"] is False


def test_suggestions_endpoint_returns_local_fallback_without_key(monkeypatch):
    monkeypatch.delenv("REQUESTY_API_KEY", raising=False)
    response = client.post("/suggestions", json={"confirmed_words": ["help"], "output_language": "en"})
    assert response.status_code == 200
    body = response.json()
    assert "I need help" in body["suggestions"]
    assert body["used_requesty"] is False


def test_suggestions_endpoint_rejects_empty_word_list():
    response = client.post("/suggestions", json={"confirmed_words": [], "output_language": "en"})
    assert response.status_code == 422


def test_suggestions_endpoint_rejects_unsupported_language():
    response = client.post("/suggestions", json={"confirmed_words": ["help"], "output_language": "fr"})
    # Pydantic's Literal validation rejects this before it reaches our code,
    # returning FastAPI's own 422, which is still the correct client-error
    # status code for a bad request.
    assert response.status_code == 422


def test_suggestions_endpoint_rejects_oversized_word_list():
    words = [f"word{i}" for i in range(13)]  # MAX_WORDS is 12
    response = client.post("/suggestions", json={"confirmed_words": words, "output_language": "en"})
    assert response.status_code == 422


def test_suggestions_endpoint_rejects_overlong_single_word():
    long_word = "x" * 500
    response = client.post("/suggestions", json={"confirmed_words": [long_word], "output_language": "en"})
    assert response.status_code == 422


def test_suggestions_endpoint_rejects_missing_confirmed_words_field():
    response = client.post("/suggestions", json={"output_language": "en"})
    assert response.status_code == 422


def test_suggestions_endpoint_rejects_non_string_items_in_word_list():
    response = client.post(
        "/suggestions", json={"confirmed_words": [123, 456], "output_language": "en"}
    )
    assert response.status_code == 422


def test_suggestions_endpoint_rejects_landmark_shaped_payload():
    """A request stuffed with a numeric-array-like payload disguised as a
    confirmed word must be rejected, never silently accepted or forwarded
    anywhere: this endpoint must never be usable to smuggle landmark or
    video data through the confirmed_words field."""
    fake_landmark_blob = ",".join(str(i * 0.0001) for i in range(5000))
    response = client.post(
        "/suggestions", json={"confirmed_words": [fake_landmark_blob], "output_language": "en"}
    )
    assert response.status_code == 422


def test_suggestions_endpoint_auth_error_surfaces_as_502(monkeypatch):
    """When Requesty is configured but auth fails, the endpoint must
    surface a clear 502 (upstream failure) rather than a fake 200 success
    or a generic 500 with no explanation."""
    import app.main as main_module

    def fake_get_suggestions(confirmed_words, output_language):
        from app.suggestions import RequestyAuthError

        raise RequestyAuthError("Requesty authentication failed. Check REQUESTY_API_KEY.")

    monkeypatch.setattr(main_module, "get_suggestions", fake_get_suggestions)

    response = client.post("/suggestions", json={"confirmed_words": ["help"], "output_language": "en"})
    assert response.status_code == 502
