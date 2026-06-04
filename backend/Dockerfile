FROM python:3.11-slim

WORKDIR /app

# Use Tencent Cloud mirrors (faster in China)
RUN sed -i 's/deb.debian.org/mirrors.tencent.com/g' /etc/apt/sources.list.d/debian.sources

# System deps for asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libreoffice-writer fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (Tsinghua pip mirror)
COPY requirements.txt .
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# Copy application code
COPY app/ ./app/

# Non-root user
RUN useradd -m -u 1001 appuser \
    && mkdir -p /data/competitions \
    && chown -R appuser:appuser /app /data/competitions
USER appuser

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
