FROM python:3.11-slim

WORKDIR /app

# Install system deps for pdfplumber
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpoppler-dev \
        poppler-utils \
        gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY whatsapp/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY whatsapp/ ./whatsapp/
COPY cert_rag/config/ ./cert_rag/config/
COPY .env ./.env

WORKDIR /app/whatsapp

EXPOSE 8300

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import httpx; r = httpx.get('http://localhost:8300/health'); assert r.status_code == 200"

# Run with uvicorn (production settings)
CMD ["python", "-m", "uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8300", \
     "--workers", "2", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
