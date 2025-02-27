# Node.js 이미지 기반 (LTS 버전 사용)
FROM node:23-alpine3.20

# 작업 디렉터리 설정
WORKDIR /var/my-react-app

# React CLI 설치 및 기본 개발 도구 추가
RUN npm install -g create-react-app react-helmet

# 컨테이너 실행 시 기본 명령
CMD ["sh", "-c", "npm install && npm run build && tail -f /dev/null"]