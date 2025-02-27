# Transcendence: Django 기반 실시간 웹 핑퐁 게임 🕹️

Transcendence는 Django, REST API, WebSocket을 활용하여 개발된 실시간 웹 핑퐁 게임입니다. 42 경산 학생들을 위해 제작되었으며, 온라인에서 빠르고 재미있는 핑퐁 게임 경험을 제공하는 데 초점을 맞췄습니다. OAuth 2.0을 통한 간편한 로그인, 실시간 게임 플레이, 친구 기능, 토너먼트 모드 등을 제공합니다.

## 주요 특징

*  **실시간 멀티플레이어**: WebSocket을 통해 구현된 실시간 핑퐁 게임 플레이를 경험하세요.
*  **Django 기반 백엔드**: 안정적이고 확장 가능한 Django 프레임워크를 사용하여 개발되었습니다.
*  **RESTful API**: 효율적인 데이터 관리 및 통신을 위한 REST API를 제공합니다.
* **OAuth 2.0 로그인**: 42 ID 및 Google 계정을 통한 간편한 로그인 지원
*  **다양한 기능**: 친구 추가, 실시간 채팅, 토너먼트 모드 등 풍부한 소셜 기능 제공
*  **Docker 기반 배포**: Docker를 사용하여 환경 의존성 없이 간편하게 배포 가능

## 기술 스택

* Django
* Django REST Framework
* React
* WebSocket (Channels)
* Docker

## 실행 방법 (개발 환경)

저장소 클론: git clone [Transcendence 저장소 URL]
Docker Compose 실행: docker-compose up --build
웹 브라우저에서 http://localhost:8000 (또는 설정된 주소)에 접속

## 주요 기능 사용법

*  **로그인**: 메인 페이지에서 42 ID 또는 Google 계정으로 로그인합니다.
*  **게임 시작**: 홈 화면에서 "Start Game" 버튼을 클릭하여 매칭을 시작합니다.
*  **친구 추가**: 다른 사용자의 프로필에서 "Add" 버튼을 클릭하여 친구 요청을 보냅니다.
*  **채팅**: 친구 목록에서 친구를 선택하여 실시간 채팅을 시작합니다.
*  **토너먼트 참가**: 홈 화면에서 "Tournament Mode"를 선택하고 닉네임을 입력하여 토너먼트에 참가합니다.

## 추가 정보

Transcendence 프로젝트는 실시간 웹 애플리케이션 개발, Django, WebSocket, REST API 학습에 유용한 참고 자료입니다.
