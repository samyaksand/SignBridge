# Minimal Dockerfile for the SoundSigns speech-to-ISL translation service
# (Flask, a lightweight HTTP proxy to Requesty's LLM API, no heavy ML).
# Works on any Docker-based free host. Render can also run this service
# directly from requirements.txt without Docker; this file exists for
# portability to a Docker-only host (e.g. Hugging Face Spaces).
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8122
EXPOSE 8122

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 2 --timeout 30 transcription:app"]
