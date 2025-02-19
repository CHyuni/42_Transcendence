(function () {
const canvas = document.getElementById("pong");
const ctx = canvas.getContext('2d');

const ball = {
    x : canvas.width/2,
    y : canvas.height/2,
    radius : 10,
    velocityX : 5,
    velocityY : 5,
    speed : 7,
    color : "WHITE"
}

// User1 Paddle
const user1 = {
    x : 0, // left side of canvas
    y : (canvas.height - 100)/2, // -100 the height of paddle
    width : 10,
    height : 100,
    score : 0,
    color : "WHITE"
}

// user2 Paddle
const user2 = {
    x : canvas.width - 10, // - width of paddle
    y : (canvas.height - 100)/2, // -100 the height of paddle
    width : 10,
    height : 100,
    score : 0,
    color : "WHITE"
}

// NET
const net = {
    x : (canvas.width - 2)/2,
    y : 0,
    height : 10,
    width : 2,
    color : "WHITE"
}

function drawRect(x, y, w, h, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, w, h);
}

function drawArc(x, y, r, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.fill();
}

canvas.tabIndex = 1;
canvas.focus();

function drawNet(){
	for(let i = 0; i <= canvas.height; i+=15){
		drawRect(net.x, net.y + i, net.width, net.height, net.color);
	}
}

function drawText(text,x,y){
	ctx.fillStyle = "#FFF";
	ctx.font = "75px Arial";
	ctx.fillText(text, x, y);
}

function render(){    
	// clear the canvas
	drawRect(0, 0, canvas.width, canvas.height, "#000");

	// draw the user1 score to the left
	drawText(user1.score,canvas.width/4,canvas.height/5);

	// draw the user2 score to the right
	drawText(user2.score,3*canvas.width/4,canvas.height/5);

	// draw the net
	drawNet();

	// draw the user1's paddle
	drawRect(user1.x, user1.y, user1.width, user1.height, user1.color);

	// draw the user2's paddle
	drawRect(user2.x, user2.y, user2.width, user2.height, user2.color);

	// draw the ball
	drawArc(ball.x, ball.y, ball.radius, ball.color);
}

canvas.addEventListener("keydown", getKeyboardPos);

function getKeyboardPos(evt) {
    const key = evt.key;
    const PADDLE_SPEED = user1.height/5;  // 이동 속도를 상수로 정의

    if (key == "ArrowDown") {
        // 패들이 캔버스 아래쪽 경계를 넘지 않도록
        if (user1.y + user1.height < canvas.height) {
            user1.y += PADDLE_SPEED;
        }
    }
    else if (key == "ArrowUp") {
        // 패들이 캔버스 위쪽 경계를 넘지 않도록
        if (user1.y > 0) {
            user1.y -= PADDLE_SPEED;
        }
    }
    else if (key == "s" || key == "S") {
        if (user2.y + user2.height < canvas.height) {
            user2.y += PADDLE_SPEED;
        }
    }
    else if (key == "w"|| key == "W") {
        if (user2.y > 0) {
            user2.y -= PADDLE_SPEED;
        }
    }
}

const roomName = document.getElementById('room-name').textContent;
const gameSocket = new WebSocket(`wss://${window.location.host}/ws/pong/${roomName}/`);

window.pongGameSocket = gameSocket;

let timeoutId = null;
const maxTries = 12;
let currentTries = 0;
let gameStarted = false;

const handleKeyDown = (event) => {
    const key = event.key;
    if (gameStarted && (key == "ArrowDown" || key == "ArrowUp" || key == "w" || key == "s" || key == "W" || key == "S")) {
        if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
            gameSocket.send(JSON.stringify({
                'key': key,
            }));
        }
    }
};

// 이벤트 리스너 추가
document.addEventListener('keydown', handleKeyDown);

gameSocket.onmessage = (e) => {
	const data = JSON.parse(e.data);
    if (data.type === 'token_expired') {
        window.alert('로그인 시간이 만료되어 메인 페이지로 이동합니다.');
        window.location.href = '/';
        return ;  
    }
	if (data.type === 'game_start') {
		if (!gameStarted) {
			gameStarted = true;
		}
	} else if (data.type === 'game_stop') {
		if (gameStarted) {
			gameStarted = false;
		}
	} else if (data.type === 'game_win') {
        gameSocket.close();
        const gameEndEvent = new CustomEvent('gameEnd', {
            detail: { result: 'win', user1_score: data.user1_score, user2_score: data.user2_score }
        });
        window.dispatchEvent(gameEndEvent);
        alert('승리 하였습니다.');
        return;
    } else if (data.type === 'game_lose') {
        gameSocket.close();
        const gameEndEvent = new CustomEvent('gameEnd', {
            detail: { result: 'lose' }
        });
        window.dispatchEvent(gameEndEvent);
        alert('패배 하였습니다.');
        return;
    } else if (data.type === 'timeout_check') {
        const timecheck = (currentTries) => {
            if (gameStarted) {
                console.log('Game started, clearing timeout');
                clearTimeout(timeoutId);
                timeoutId = null;
                currentTries = 0;
                return;
            }
            if (currentTries < maxTries) {
                currentTries++;
                console.log('timecheck:', currentTries);
                timeoutId = setTimeout(() => timecheck(currentTries), 5000);
            } else {
                console.log('max tries reached. stopping');
                clearTimeout(timeoutId);
                timeoutId = null;
                currentTries = 0;
                const gamemessage = { type: 'timeout' };
                gameSocket.send(JSON.stringify(gamemessage))
                gameSocket.close();
                const gameEndEvent = new CustomEvent('gameEnd', {
                    detail: { result: 'win', user1_score: 0, user2_score: 0 }
                });
                window.dispatchEvent(gameEndEvent);
                alert('승리 하였습니다.');
            }
        };
    
        if (!timeoutId) {
        console.log('Starting timeout check');
        timeoutId = setTimeout(() => timecheck(0), 5000);
        }
    }
	else {
		const gameState = data.game_state;

		ball.x = gameState.ball.x;
		ball.y = gameState.ball.y;
		ball.radius = gameState.ball.radius;
		ball.velocityX = gameState.ball.velocityX;
		ball.velocityY = gameState.ball.velocityY;
		ball.speed = gameState.ball.speed;

		user1.x = gameState.user1.x;
		user1.y = gameState.user1.y;
		user1.width = gameState.user1.width;
		user1.height = gameState.user1.height;
		user1.score = gameState.user1.score;

		user2.x = gameState.user2.x;
		user2.y = gameState.user2.y;
		user2.width = gameState.user2.width;
		user2.height = gameState.user2.height;
		user2.score = gameState.user2.score;

		render();
	}
}


gameSocket.onclose = (e) => {
	console.log('Close code:', e.code);
    if (e.code === 1006) {
        window.location.href = '/'
    }
};

window.onbeforeunload = () => {
	gameSocket.close();  // 페이지가 닫히기 전에 WebSocket 연결 종료
};

function init(){
	render();
}

init();
})();
