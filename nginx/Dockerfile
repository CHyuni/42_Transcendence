FROM nginx:1.26.2-alpine3.20

RUN apk update && apk add dumb-init

RUN mkdir /home/static

EXPOSE 8080

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
#CMD ["tail", "-f", "/dev/null"]
