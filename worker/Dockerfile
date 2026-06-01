FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --retries 10 --timeout 300 -r requirements.txt

COPY main.py auth_telethon.py ./

RUN mkdir -p /data /agents

ENV TELEGRAM_SESSION=/data/botfather_session

CMD ["uvicorn", "main:api", "--host", "0.0.0.0", "--port", "8000"]
