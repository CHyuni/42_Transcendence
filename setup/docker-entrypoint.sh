#!/bin/sh

htpasswd -bc /etc/nginx/.htpasswd ${NGINX_EXPORTER_USER} ${NGINX_EXPORTER_PASSWORD}
# nginx 설정 파일 생성
envsubst '${SERVER_IP}' < /etc/nginx/default.conf.template > /etc/nginx/conf.d/default.conf

# SSL 인증서 생성
mkdir -p /etc/nginx/ssl

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/private.key \
  -out /etc/nginx/ssl/certificate.crt \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=Development/CN=localhost"

# nginx 실행
nginx -g 'daemon off;'