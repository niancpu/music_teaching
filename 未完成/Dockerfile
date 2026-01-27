FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by pillow / lxml used by python-pptx
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libxml2-dev \
       libxslt1-dev \
       zlib1g-dev \
       libjpeg-dev \
       libfreetype6-dev \
       libpng-dev \
       wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage docker cache
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Copy application
COPY . /app

EXPOSE 5000

# Use gunicorn to run the Flask app
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "ppt_generator:app"]
