"""
Suggestion endpoint logic.

STATUS: this talks to Requesty ONLY if REQUESTY_API_KEY is set in the
environment. In this build, no key is configured, so every call uses the
local curated fallback below. We do not fake a network call here, if a key
is present we would call REQUESTY_BASE_URL with the model priority list from
frontend/lib/config/requestyModels.ts (mirrored below for backend use), but
that code path is simply not exercised without a real key.
"""

import os
from typing import List, Literal

OutputLanguage = Literal["en", "hi"]

REQUESTY_MODEL_PRIORITY = [
    "nvidia/nemotron-3-super-120b-a12b",
    "google/gemma-4-31b-it",
    "nvidia/nemotron-3.5-lightning-30b-a3b",
    "novita/ling-3.1-flash",
    "mistral/leanstral-1-5",
    "nvidia/muse-glimmer-30b",
    "novita/inclusionai/ling-3.0-tiny",
]

# Small local curated map from confirmed words to natural follow-on phrases.
# This is the fallback path that always runs in this build.
_LOCAL_SUGGESTIONS = {
    "help": ["I need help", "Please help me", "Can you help, please?"],
    "hungry": ["I am hungry", "Can I have food, please?"],
    "water": ["I need water", "Can I have some water?"],
    "tired": ["I am tired", "I need a break"],
    "thank you": ["Thank you", "Thank you so much"],
}


def is_requesty_configured() -> bool:
    return bool(os.environ.get("REQUESTY_API_KEY"))


def get_suggestions(confirmed_words: List[str], output_language: OutputLanguage = "en") -> List[str]:
    """
    Returns short, friendly sentence suggestions built from confirmed words.

    Always uses the local curated fallback in this build, since no
    REQUESTY_API_KEY is present. If a key were configured, a future version
    of this function would call Requesty with REQUESTY_MODEL_PRIORITY,
    sending ONLY the confirmed words (never raw video or landmarks) and the
    requested output language.
    """
    if not confirmed_words:
        return []

    key = confirmed_words[0].lower()
    if key in _LOCAL_SUGGESTIONS:
        return _LOCAL_SUGGESTIONS[key]

    # Generic honest fallback: just join the confirmed words.
    joined = " ".join(confirmed_words)
    return [joined]
