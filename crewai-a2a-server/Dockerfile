# Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY ./src /app
COPY ./pyproject.toml /app
COPY ./README.md /app

# Instala uv y crea el entorno virtual con dependencias
RUN pip install --upgrade pip \
	&& pip install uv \
	&& uv venv .venv \
	&& uv pip install -r pyproject.toml

ENV PYTHONPATH=/app
