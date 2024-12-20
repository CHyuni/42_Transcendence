const canvas = document.getElementById("pong");
const ctx = canvas.getContext('2d');

let ball = {
	x : 0,
	y : 0,
	radius : 0,
	velocityX : 0,
	velocityY : 0,
	speed : 0,
	color : "WHITE"
}

let user1 = {
	x : 0,
	y : 0,
	width : 0,
	height : 0,
	score : 0,
	color : "WHITE"
}

let user2 = {
	x : 0,
	y : 0,
	width : 0,
	height : 0,
	score : 0,
	color : "WHITE"
}

const net = {
	x : (canvas.width - 2) / 2,
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
	ctx.font = "75px fantasy";
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

function game(){
	render();
}


const roomName = document.getElementById('room-name').textContent;
const gameSocket = new WebSocket(`ws://${window.location.host}/ws/pong/${roomName}/`);
let gameStarted = false;
let loop;

gameSocket.onmessage = (e) => {
	const data = JSON.parse(e.data);
	if (data.type === 'game_start') {
		console.log(data.type);
		if (!gameStarted) {
			gameStarted = true;
			let framePerSecond = 50;
			loop = setInterval(game, 1000 / framePerSecond);
		}
	} else if (data.type === 'game_stop') {
		if (gameStarted) {
			clearInterval(loop);
			gameStarted = false;
			loop = null;
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
	console.error('WebSocket connection closed unexpectedly', e);
	console.error('Close code:', e.code);
	console.error('close reason:', e.reason);
};

document.addEventListener('keydown', (event) => {
	const key = event.key;
	console.log(key)
	if (key == "ArrowDown" || key == "ArrowUp" || key == "w" || key == "s" || key == "W" || key == "S") {
		gameSocket.send(JSON.stringify({
			'key': key,
		}));
	}
});

window.onbeforeunload = () => {
	gameSocket.close();  // 페이지가 닫히기 전에 WebSocket 연결 종료
};

function init(){
	render();
}

init();