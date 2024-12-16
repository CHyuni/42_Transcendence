FROM python:3.11-slim

RUN apt-get update && apt-get install -y dumb-init
	
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /home

EXPOSE 8000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
# CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
CMD ["python", "-m", "uvicorn", "test_site.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--reload"]
# CMD ["tail", "-f", "/dev/null"]
