FROM python:3.12-slim

# Prevent Python from writing .pyc files & buffer outputs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . /app/

# Expose standard web port
EXPOSE 5000

# Start Gunicorn server (bind to $PORT if provided by cloud platforms like Render/Railway)
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --threads 4 app:app"]
