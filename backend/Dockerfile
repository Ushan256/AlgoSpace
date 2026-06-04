FROM python:3.10-slim

# Set strict system stability environment flags
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set the working directory inside the container
WORKDIR /code

# Install system dependencies needed for compiling certain python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt /code/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend source code into the container
COPY . /code/

# Expose port 7860 (Hugging Face Spaces strictly mandates your container uses port 7860)
EXPOSE 7860

# Run database migrations and start Gunicorn binding to port 7860
CMD ["sh", "-c", "python manage.py migrate && gunicorn algospace.wsgi:application --bind 0.0.0.0:7860"]
