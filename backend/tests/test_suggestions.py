import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.suggestions import get_suggestions, is_requesty_configured


def test_returns_local_fallback_for_known_word():
    result = get_suggestions(["help"])
    assert "I need help" in result


def test_returns_joined_words_for_unknown_input():
    result = get_suggestions(["purple", "elephant"])
    assert result == ["purple elephant"]


def test_returns_empty_list_for_no_words():
    assert get_suggestions([]) == []


def test_requesty_not_configured_without_env_key(monkeypatch):
    monkeypatch.delenv("REQUESTY_API_KEY", raising=False)
    assert is_requesty_configured() is False
