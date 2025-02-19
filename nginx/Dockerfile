FROM nginx:1.26.2-alpine3.20

RUN apk add --no-cache openssl apache2-utils

COPY default.conf.template /etc/nginx/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
