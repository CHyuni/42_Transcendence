document.addEventListener('DOMContentLoaded', function () {
	const contentDiv = document.getElementById('content');
	const userListDiv = document.getElementById('user-list');
	const modal = document.getElementById('chat-modal');
    const modalBackground = document.getElementById('modal-background');
    const closeButton = document.getElementById('close-btn');

	fetch('/accounts/users/me/get-myname/')
		.then(response => {
			if (response.status === 200) {
				response.json().then(data => {
					const username = data.username;
					contentDiv.innerHTML = `
						<h1 class="headline">Welcome, ${username}</h1>
						<button id="playButton" class="btn first">playing</button>
						<button id="logoutButton" class="btn second">Logout</button>
					`;
					document.getElementById('playButton').addEventListener('click', function() {
						window.location.href = '/game';
					})
					document.getElementById('logoutButton').addEventListener('click', logout);
					fetchLoggedInUsers();
					userListDiv.style.display = 'flex';
				});
			} else {
				contentDiv.innerHTML = `
					<h1 class="headline">PING PONG</h1>
					<button id="loginButton" class="btn first">continue with 42</button>
				`;
				document.getElementById('loginButton').addEventListener('click', login);
			}
		})
		.catch(error => {
			console.error('Error checking login status:', error);
		});
	
	function login() {
		const clientId = 'u-s4t2ud-2f36542895ec170f78a3b16b336312f13826f4f1cc5a856127e0bd6119deefcd';
		const redirectUri = encodeURIComponent('http://10.12.8.3:8080/callback/');
		const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
		window.location.href = authUrl;
	}

	function logout() {
		fetch('/logout/', {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken')
			}
		})
		.then(response => {
			if (response.status === 200) {
				window.location.reload();
			}
		});
	}

	function getCookie(name) {
		const cookieValue = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
		return cookieValue ? cookieValue[1] : null;
	}

	function fetchLoggedInUsers() {
        fetch('/accounts/users/online-users/')
            .then(response => response.json())
            .then(data => {
                const users = data.users;
                updateUserList(users);
            })
            .catch(error => {
                console.error('Error fetching logged-in users:', error);
            });
    }

	function updateUserList(users) {
        userListDiv.innerHTML = ''; // 기존 목록을 초기화

        // 유저 목록을 div로 표시
		users.forEach(user => {
			const userDiv = document.createElement('div');
			userDiv.className = 'user-item';
	
			const userButton = document.createElement('button');
			userButton.className = 'user-button';  // 버튼에 별도 스타일을 추가할 수 있음
			userButton.textContent = user;  // 유저 이름을 버튼에 표시
	
			// 버튼 클릭 시의 동작 추가
			userButton.addEventListener('click', () => {
				window.ChatManager.openChatModal(user);
			});
			userDiv.appendChild(userButton);
			userListDiv.appendChild(userDiv);
		});
    }
});
