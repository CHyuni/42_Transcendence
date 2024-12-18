window.ChatManager = {
	chatSockets: {},

	openChatModal: function(username) {
		if (this.chatSockets[username]) {
			console.log(`이미 ${username}과 연결됨`);
			return;
		}
		fetch('/api/check-login-status')
			.then(response => response.json())
			.then(data => {
				const myname = data.username;  // 로그인한 사용자 이름 가져오기
				
				// username과 myname을 알파벳 순으로 정렬하여 방 이름 생성
				const sortedNames = [username, myname].sort();
				const roomName = `chat_${sortedNames[0]}_${sortedNames[1]}`;

				// WebSocket 연결
				const newChatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${roomName}/`);
				this.chatSockets[username] = newChatSocket;

				newChatSocket.onmessage = function(e) {
					const data = JSON.parse(e.data);
					const message = data['message'];
					const chatContent = document.getElementById('chat-content');
					chatContent.innerHTML += `<div class="received-message">${message}</div>`;
				};

				newChatSocket.onclose = function(e) {
					console.error(`${username}과의 채팅 연결이 끊어졌습니다.`);
					delete ChatManager.chatSockets[username];
				};

				// 채팅 창 설정
				const modal = document.getElementById('chat-modal');
				const usernameElement = modal.querySelector('.username');
				usernameElement.textContent = username;
				modal.style.display = 'flex';
			})
			.catch(error => {
				console.error("로그인 상태 확인 중 오류 발생:", error);
			});
	},

	sendMessage: function(username) {
		const messageInput = document.getElementById('chat-box');
		const message = messageInput.value;

		if (this.chatSockets[username] && this.chatSockets[username].readyState === WebSocket.OPEN) {
            this.chatSockets[username].send(JSON.stringify({ 'message': message }));
            
            // 보낸 메시지를 UI에 추가
            const chatContent = document.getElementById('chat-content');
            chatContent.innerHTML += `<div class="sent-message">${message}</div>`;
        }

        messageInput.value = '';  // 메시지 입력란 비우기
	},

	closeChatModal: function(username) {
		if (this.chatSockets[username]) {
			this.chatSockets[username].close();
			delete this.chatSockets[username];
		}

		const modal = document.getElementById('chat-modal');
		
		modal.style.display = 'none';
	}
};

document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('close-btn');
    const sendBtn = document.querySelector('.send-btn');

    // 닫기 버튼 이벤트
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const username = document.querySelector('.username').textContent;
            window.ChatManager.closeChatModal(username);
        });
    }

    // 전송 버튼 이벤트
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            const username = document.querySelector('.username').textContent;
            window.ChatManager.sendMessage(username);
        });
    }
});