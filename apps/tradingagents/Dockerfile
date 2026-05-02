FROM python:3.12-slim

# Install tradingagents + web deps at build time
RUN pip install --no-cache-dir \
    tradingagents \
    uvicorn \
    fastapi

# Copy app files
COPY server.py /app/server.py
COPY start.sh /app/start.sh
COPY web/ /app/web/

RUN chmod +x /app/start.sh

WORKDIR /app

EXPOSE 8080

CMD ["/app/start.sh"]
