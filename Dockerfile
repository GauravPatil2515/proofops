# ProofOps Multi-stage Dockerfile
# Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Runtime stage
FROM python:3.12-slim AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Create non-root user
RUN useradd --no-create-home --shell /bin/bash proofops

# Copy application code
COPY --chown=proofops:proofops . .

# Create data directory for SQLite (if used) and keys
RUN mkdir -p /app/data /app/verification/.keys && chown -R proofops:proofops /app/data /app/verification/.keys

# Switch to non-root user
USER proofops

# Expose port
EXPOSE 8000

# Environment variables
ENV PYTHONPATH=/app
ENV PROOFOPS_PORT=8000
ENV PROOFOPS_DEV_MODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health', timeout=5).raise_for_status()" || exit 1

# Run the application
CMD ["python", "server.py"]