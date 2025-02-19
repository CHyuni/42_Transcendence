#!/bin/sh

# 로그 디렉토리 설정
mkdir -p /var/log/redis
chown 1000:1000 /var/log/redis 
chmod 777 /var/log/redis

# Redis 서버 실행 (su 대신 직접 실행)
exec redis-server /etc/redis/redis.conf 