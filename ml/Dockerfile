# ═══════════════════════════════════════════════════════════════
# SENTRIX ML Service — Dockerfile
# ═══════════════════════════════════════════════════════════════

FROM python:3.12-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r sentrix && useradd -r -g sentrix sentrix

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code as a package folder
COPY . ml/

# Create model directory
RUN mkdir -p ml/models/saved && chown -R sentrix:sentrix /app

USER sentrix

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()" || exit 1

CMD ["uvicorn", "ml.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
