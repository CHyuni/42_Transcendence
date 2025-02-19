FROM python:3.11-slim

RUN apt-get update && apt-get install -y dumb-init supervisor
	
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /home

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
