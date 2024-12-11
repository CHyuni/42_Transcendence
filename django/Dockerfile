FROM python:3.11-slim

RUN apt-get update && apt-get install -y dumb-init
	
RUN pip install --no-cache-dir django uvicorn

WORKDIR /home

EXPOSE 8000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["python", "-m", "uvicorn", "test_site.asgi:application", "--host", "0.0.0.0", "--port", "8000"]
CMD ["tail", "-f", "/dev/null"]
