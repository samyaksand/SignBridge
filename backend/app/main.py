"""
Optional FastAPI backend stub for SignBridge.

This backend is entirely OPTIONAL. The frontend works completely without it.
It exists to scaffold a future Milestone 4 integration (Requesty-powered
sentence suggestions). Without a REQUESTY_API_KEY, every request is served
from the local curated fallback in app/suggestions.py, honestly, with no
network calls pretended or faked.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Literal

from .suggestions import get_suggestions, is_requesty_configured

app = FastAPI(
    title="SignBridge backend (optional, Milestone 4 scaffold)",
    description=(
        "Accepts confirmed word meanings and an output language, and returns "
        "short sentence suggestions. Uses only the local curated fallback "
        "unless REQUESTY_API_KEY is set."
    ),
)


class SuggestionRequest(BaseModel):
    confirmed_words: List[str]
    output_language: Literal["en", "hi"] = "en"


class SuggestionResponse(BaseModel):
    suggestions: List[str]
    used_requesty: bool


@app.get("/health")
def health():
    return {"status": "ok", "requesty_configured": is_requesty_configured()}


@app.post("/suggestions", response_model=SuggestionResponse)
def suggestions(payload: SuggestionRequest):
    results = get_suggestions(payload.confirmed_words, payload.output_language)
    return SuggestionResponse(suggestions=results, used_requesty=is_requesty_configured())
