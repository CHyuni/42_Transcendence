# Transcendence: Django 기반 실시간 웹 핑퐁 게임 🕹️

Transcendence는 Django, REST API, WebSocket을 활용하여 개발된 실시간 멀티플레이어 핑퐁 게임입니다. 42 ID와 Google 계정 OAuth 2.0 로그인을 지원하며, 친구 기능과 토너먼트 모드를 통해 더욱 풍부한 게임 경험을 제공합니다.

## 주요 특징

*   **실시간 멀티플레이어:** WebSocket 기반 실시간 핑퐁 게임 플레이
*   **강력한 백엔드:** Django 프레임워크 기반의 안정적이고 확장 가능한 시스템
*   **효율적인 API:** RESTful API를 통한 효율적인 데이터 관리 및 통신
*   **OAuth 2.0 로그인:** 42 ID 및 Google 계정 간편 로그인 지원
*   **소셜 기능:** 친구 추가, 실시간 채팅, 사용자 프로필 등 다양한 소셜 기능
*   **간편한 배포:** Docker를 사용하여 환경 의존성 없이 간편하게 배포 가능

## 기술 스택

* Django
* Django REST Framework
* React
* WebSocket (Channels)
* Docker

## 실행 방법

1.  **저장소 클론:** `git clone https://github.com/CHyuni/42_Transcendence`
2.  **프로젝트 디렉토리 이동:** `cd 42_Transcendence`
3.  **.env 파일 설정:**
    *   저장소에 포함된 `.env.example` 파일은 **예시**입니다.
    *   `.env.example` 파일을 복사하여 사용하거나, 새로운 `.env` 파일을 생성하십시오.
    *   각 설정 항목 (데이터베이스 정보, API 키 등)에 **실제 값**을 입력하십시오.
4.  **빌드 및 실행:** `make`
5.  **웹 브라우저 접속:** `http://localhost:8080`

## 주요 기능 사용법

*  **로그인**: 메인 페이지에서 42 ID 또는 Google 계정으로 로그인합니다.
*  **게임 시작**: 홈 화면에서 "Start Game" 버튼을 클릭하여 매칭을 시작합니다.
*  **친구 추가**: 다른 사용자의 프로필에서 "Add" 버튼을 클릭하여 친구 요청을 보냅니다.
*  **채팅**: 친구 목록에서 친구를 선택하여 실시간 채팅을 시작합니다.
*  **토너먼트 참가**: 홈 화면 좌측 상단의 "Casual Mod" 및 "Tournament Mod"를 클릭 시 모드 토글, "Tournament Mod" 선택 후 "Start Game" 버튼을 클릭, 4명이 모이면 시작.

## 추가 정보

Transcendence 프로젝트는 실시간 웹 애플리케이션 개발, Django, WebSocket, REST API 학습에 유용한 참고 자료입니다.
