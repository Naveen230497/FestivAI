FROM python:3.11-slim

WORKDIR /app

# Copy application files
COPY app/ ./app/
COPY static/ ./static/

# Cloud Run defaults
ENV HOST=0.0.0.0
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["python", "-m", "app.server"]
