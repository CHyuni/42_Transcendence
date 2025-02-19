(function () {
    const canvas = document.getElementById("ai_pong");
    const ctx = canvas.getContext('2d');
    let isPaused = false;    
    
    const ball = {
        x : canvas.width/2,
        y : canvas.height/2,
        radius : 14,
        velocityX : 5,
        velocityY : 5,
        speed : 7,
        color : "WHITE"
    }
    
    // User1 Paddle
    const user1 = {
        x : 0, // left side of canvas
        y : (canvas.height - 150)/2, // -100 the height of paddle
        width : 15,
        height : 150,
        score : 0,
        color : "RED"
    }
    
    // user2 Paddle
    const user2 = {
        x : canvas.width - 15, // - width of paddle
        y : (canvas.height - 150)/2, // -100 the height of paddle
        width : 15,
        height : 150,
        score : 0,
        color : "BLUE",
    }
    
    // NET
    const net = {
        x : (canvas.width - 2)/2,
        y : 0,
        height : 7,
        width : 2,
        color : "BLACK"
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
    
    const PADDLE_SPEED = user1.height / 5;  // 이동 속도를 상수로 정의
    
    function drawNet(){
        for(let i = 0; i <= canvas.height; i+=15){
            drawRect(net.x, net.y + i, net.width, net.height, net.color);
        }
    }
    
    function drawText(text,x,y){
        ctx.fillStyle = "#FFF";
        ctx.font = "90px Arial";
        ctx.fillText(text, x, y);
    }
    
    function render(opacity){
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();  // 현재 상태 저장
        ctx.globalAlpha = opacity;  // 흐리게 처리
        // clear the canvas
        drawRect(0, 0, canvas.width, canvas.height, "rgb(15, 155, 15)");
    
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
        ctx.restore();  // 상태 복원
    }
    
    canvas.addEventListener("keydown", getKeyboardPos);
    
    function togglePause() {
        if (isPaused) {
          // 게임이 paused 상태이면 다시 시작
        //   startGame();
          isPaused = false;
        } else {
          isPaused = true;
        }
      }
    
    function getKeyboardPos(evt) {
        const key = evt.key;
    
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
    }
    
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        // if (gameStarted && key == "ArrowDown" || key == "ArrowUp" || key == "w" || key == "s" || key == "W" || key == "S") {
        if (key == "ArrowDown" || key == "ArrowUp" || key == "w" || key == "s" || key == "W" || key == "S") {
            // gameSocket.send(JSON.stringify({
            // 	'key': key,
            // }));
        }
        if (key === 'p') {
            togglePause();
        }
    });
    
    function jajo() {
        let randomValue = Math.random() < 0.15 ? 1 : -1;
        let rand = Math.ceil(Math.random() * 5);
        if (randomValue == -1)
        {
            let random = Math.random() < 0.75 ? 1 : -1;
            if (user2.y < ball.y && user2.y + user2.height < canvas.height)
                user2.y += PADDLE_SPEED;
            else if (user2.y > ball.y && user2.y > 0)
                user2.y -= PADDLE_SPEED;
            if (random == 1)
            {
                let dif = Math.ceil(Math.abs(ball.y - user2.y) / PADDLE_SPEED);
                if (dif <= 5)
                    dif = Math.min(rand, Math.ceil(dif / 2));
                else if (dif <= 15)
                    dif = Math.min(rand, Math.ceil(dif / 3));
                else
                    dif = Math.min(rand, Math.ceil(dif / 4));
                if (user2.y < ball.y)
                    user2.y += dif * PADDLE_SPEED;
                else
                    user2.y -= dif * PADDLE_SPEED;
            }
        }
        else
        {
            randomValue = Math.random() < 0.5 ? 1 : -1;
            if (randomValue == -1 && user2.y + user2.height < canvas.height)
                user2.y += Math.min(rand * PADDLE_SPEED, canvas.height - user2.y - 150);
            else if (randomValue == 1 && user2.y > 0)
                user2.y -= Math.min(rand * PADDLE_SPEED, user2.y);
        }
    }
    
    function myeochoi() {
        let randomValue = Math.random() < 0.01 ? 1 : -1;
        if (randomValue == -1)
        {
            let random = Math.random() < 0.95 ? 1 : -1;
            if (user2.y < ball.y && user2.y + user2.height < canvas.height)
                user2.y += PADDLE_SPEED;
            else if (user2.y > ball.y && user2.y > 0)
                user2.y -= PADDLE_SPEED;
            if (random == 1)
            {
                let dif = Math.ceil(Math.abs(ball.y - user2.y) / PADDLE_SPEED);
                if (dif == 0)
                    dif = dif;
                else if (dif <= 4)
                    dif = dif - 1;
                else if (dif <= 15)
                    dif = Math.ceil(2 * dif / 3);
                else
                    dif = Math.ceil(3 * dif / 4);
                if (user2.y < ball.y)
                    user2.y += dif * PADDLE_SPEED;
                else
                    user2.y -= dif * PADDLE_SPEED;
            }
        }
    }
    
    function changhyu() {
        let rand = Math.ceil(8 * Math.random());
        if (ball.velocityX > 0)
        {
            let t1 = ball.velocityY > 0 
                    ? (canvas.height - ball.radius - ball.y) / ball.velocityY
                    : -(ball.y - ball.radius) / ball.velocityY;
            let bool = ball.x + t1 * ball.velocityX <= canvas.width - ball.radius;
            let tx = bool ? ball.x + t1 * ball.velocityX : ball.x;
            let ty = bool ? ball.y + t1 * ball.velocityY : ball.y;
            let t2 = (canvas.width - ball.radius - tx) / ball.velocityX;
            let tty = bool ? ty - t2 * ball.velocityY : ty + t2 * ball.velocityY;
            if (tty - 75 > user2.y)
                user2.y += Math.min(tty - user2.y - 75, rand * PADDLE_SPEED) + 25 * Math.random();
            else
                user2.y += -Math.min(user2.y - tty + 75, rand * PADDLE_SPEED) + 25 * Math.random();
        }
        else {
            let h = canvas.height / 2;
            let rand2 = Math.ceil(rand / 2);
            if (user2.y < h)
                user2.y += Math.min(h - user2.y, rand2 * PADDLE_SPEED);
            else if (user2.y > h)
                user2.y -= Math.min(user2.y - h, rand2 * PADDLE_SPEED);
        }
    }
    
    // 카운트다운 표시
    function showCountdown(number, callback) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // 캔버스 초기화
        render(0.7);  // 흐리게 그린 배경
        ctx.fillStyle = "black";
        ctx.font = "120px Arial";
        ctx.textAlign = "center";
        ctx.fillText(number, canvas.width / 2, canvas.height / 2);
    
        setTimeout(callback, 1000);  // 1초 대기 후 콜백 실행
    }
    
    // 카운트다운 및 게임 시작
    function startGame() {
        let count = 4;
        
        function countdownStep() {
            if (count > 1) {
                showCountdown(count - 1, countdownStep);
                count--;
            } else if (count > 0) {
                showCountdown("Start!", countdownStep);
                count--;
            }
            else {
                runGame();  // 카운트다운 후 게임 실행
            }
        }
    
        countdownStep();
    }
    
    let lastAITime = 0;
    let aiIntervalTime = 1000;
    let lastUpdateTime = 0;
    let updateIntervalTime = 20;
    let aiAccumulatedTime = 0;
    
    function runGame() {
        function gameLoop(timestamp) {
            if (!lastAITime) lastAITime = timestamp;
            if (!lastUpdateTime) lastUpdateTime = timestamp;
    
            const deltaTime = timestamp - lastUpdateTime;
            lastUpdateTime = timestamp;
    
            if (!isPaused) {
                aiAccumulatedTime += deltaTime;
    
                if (aiAccumulatedTime >= aiIntervalTime) {
                    // jajo();
                    changhyu();
                    aiAccumulatedTime -= aiIntervalTime; // 누적 시간에서 소모 시간 제거
                }
    
                update();  
                render(1);
            }
    
            requestAnimationFrame(gameLoop);
        }
    
        requestAnimationFrame(gameLoop);
    }
    
    canvas.addEventListener("keydown", getKeyboardPos);
    
    function getKeyboardPos(evt) {
        const key = evt.key;
    
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
    }
    
    function resetBall(val){
        if (val)
        {
            ball.x = 15;
            ball.velocityX = 5;
        }
        else
        {
            ball.x = canvas.width - 15;
            ball.velocityX = -5;
        }
        ball.y = canvas.height/2;
        ball.speed = 7;
    }
    
    function collision(b,p){
        p.top = p.y;
        p.bottom = p.y + p.height;
        p.left = p.x;
        p.right = p.x + p.width;
        
        b.top = b.y - b.radius;
        b.bottom = b.y + b.radius;
        b.left = b.x - b.radius;
        b.right = b.x + b.radius;
        
        return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
    }
    
    function update(){
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        // change the score of players, if the ball goes to the left "ball.x<0" user2puter win, else if "ball.x > canvas.width" the user1 win
        if( ball.x - ball.radius < 0 ){
            user2.score++;
            if (user2.score == 11) {
                alert('패배 하였습니다.')
                window.location.href = '/';
                return;
            }
            resetBall(0);
        }else if( ball.x + ball.radius > canvas.width){
            user1.score++;
            if (user1.score == 11) {
                alert('승리 하였습니다.')
                window.location.href = '/';
                return;
            }
            // user1Score.play();
            resetBall(1);
        }
        
        // the ball has a velocity
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;
        
        // user2puter plays for itself, and we must be able to beat it
        // simple AI
        // user2.y += ((ball.y - (user2.y + user2.height/2)))*0.1;
        
        // when the ball collides with bottom and top walls we inverse the y velocity.
        if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height){
            ball.velocityY = -ball.velocityY;
            // wall.play();
        }
        
        // we check if the paddle hit the user1 or the user2 paddle
        let player = (ball.x + ball.radius < canvas.width/2) ? user1 : user2;
        
        // if the ball hits a paddle
        if(collision(ball,player)){
            // play sound
            // hit.play();
            // we check where the ball hits the paddle
            let collidePoint = (ball.y - (player.y + player.height/2));
            // normalize the value of collidePoint, we need to get numbers between -1 and 1.
            // -player.height/2 < collide Point < player.height/2
            collidePoint = collidePoint / (player.height/2);
            
            // when the ball hits the top of a paddle we want the ball, to take a -45degees angle
            // when the ball hits the center of the paddle we want the ball to take a 0degrees angle
            // when the ball hits the bottom of the paddle we want the ball to take a 45degrees
            // Math.PI/4 = 45degrees
            let angleRad = (Math.PI/4) * collidePoint;
            
            // change the X and Y velocity direction
            let direction = (ball.x + ball.radius < canvas.width/2) ? 1 : -1;
            ball.velocityX = direction * ball.speed * Math.cos(angleRad);
            ball.velocityY = ball.speed * Math.sin(angleRad);
            
            // speed up the ball everytime a paddle hits it.
            ball.speed += 0.25;
        }
    }
    
    
    // window.onbeforeunload = () => {
    // 	gameSocket.close();  // 페이지가 닫히기 전에 WebSocket 연결 종료
    // };
    
    startGame();
    
    })();
