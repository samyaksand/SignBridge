"""
Optional FastAPI backend for SignBridge.

This backend is entirely OPTIONAL. The frontend works completely without it.
It accepts a short list of already-confirmed word meanings plus an output
language, and returns a small number of natural-sentence suggestions.

Without a REQUESTY_API_KEY, every request is served from the local curated
fallback in app/suggestions.py, honestly, with no network call attempted.
With a key, it calls Requesty's OpenAI-compatible router, sending only the
confirmed words and language, never raw video or landmark data, the request
schema below makes anything else structurally impossible to send.
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal

from .suggestions import (
    get_suggestions,
    is_requesty_configured,
    InvalidSuggestionRequest,
    RequestyAuthError,
    MAX_WORDS,
    MAX_WORD_LENGTH,
)
from .isl_recognition import router as isl_recognition_router

app = FastAPI(
    title="SignBridge backend",
    description=(
        "SignBridge's own backend. Includes an optional sentence-suggestion "
        "endpoint (Requesty-backed, off by default) and the ISL recognition "
        "endpoints under /isl-recognition. The ISL recognition module "
        "includes GPL-3.0-licensed code; see backend/app/isl_recognition's "
        "own module docstring and LICENSE-GPL-3.0-Cl0ud9.txt before "
        "distributing this backend."
    ),
)
app.include_router(isl_recognition_router)

# Allowed frontend origin(s) for CORS. Comma-separated if more than one is
# ever needed. Defaults to the local Next.js dev server; set ALLOWED_ORIGIN
# to the real deployed frontend origin in production.
_allowed_origins_raw = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in _allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class SuggestionRequest(BaseModel):
    # Only short strings are accepted here, never arbitrary numeric arrays or
    # blobs, so landmark/video/frame data cannot reach this endpoint even if
    # a caller tried to send it.
    confirmed_words: List[str] = Field(..., max_length=MAX_WORDS)
    output_language: Literal["en", "hi"] = "en"


class SuggestionResponse(BaseModel):
    suggestions: List[str]
    used_requesty: bool


@app.get("/health")
def health():
    return {"status": "ok", "requesty_configured": is_requesty_configured()}


@app.post("/suggestions", response_model=SuggestionResponse)
def suggestions(payload: SuggestionRequest):
    for word in payload.confirmed_words:
        if len(word) > MAX_WORD_LENGTH:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Each confirmed word must be at most {MAX_WORD_LENGTH} characters. "
                    "This endpoint only accepts short confirmed word meanings."
                ),
            )
    try:
        results = get_suggestions(payload.confirmed_words, payload.output_language)
    except InvalidSuggestionRequest as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None
    except RequestyAuthError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from None
    return SuggestionResponse(suggestions=results, used_requesty=is_requesty_configured())
