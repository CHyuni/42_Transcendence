2// select canvas element
const canvas = document.getElementById("pong");

// getContext of canvas = methods and properties to draw and do a lot of thing to the canvas
const ctx = canvas.getContext('2d');

// load sounds
let hit = new Audio();
let wall = new Audio();
let user1Score = new Audio();
let user2Score = new Audio();

// hit.src = "sounds/hit.mp3";
// wall.src = "sounds/wall.mp3";
// user2Score.src = "sounds/user2Score.mp3";
// user1Score.src = "sounds/user1Score.mp3";

// Ball object
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

// draw a rectangle, will be used to draw paddles
function drawRect(x, y, w, h, color){
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// draw circle, will be used to draw the ball
function drawArc(x, y, r, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.fill();
}
canvas.tabIndex = 1;  // 포커스 가능하게 만듦
canvas.focus(); 
// listening to the mouse
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

// when user2 or USER1 scores, we reset the ball
function resetBall(){
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}

// draw the net
function drawNet(){
    for(let i = 0; i <= canvas.height; i+=15){
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

// draw text
function drawText(text,x,y){
    ctx.fillStyle = "#FFF";
    ctx.font = "75px fantasy";
    ctx.fillText(text, x, y);
}

// collision detection
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

// update function, the function that does all calculations
function update(){
    
    // change the score of players, if the ball goes to the left "ball.x<0" user2puter win, else if "ball.x > canvas.width" the user1 win
    if( ball.x - ball.radius < 0 ){
        user2.score++;
        // user2Score.play();
        resetBall();
    }else if( ball.x + ball.radius > canvas.width){
        user1.score++;
        // user1Score.play();
        resetBall();
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
        ball.speed += 0.3;
    }
}

// render function, the function that does al the drawing
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
    update();
    render();
}
// number of frames per second
let framePerSecond = 50;

//call the game function 50 times every 1 Sec
let loop = setInterval(game,1000/framePerSecond);