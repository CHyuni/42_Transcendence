const connectToWebSocket = (username, userid, gameMod) => {
    const ws = new WebSocket(`wss://${window.location.host}/ws/matching/?username=${username}&userid=${userid}&gameMod=${gameMod}`);

    socket.onopen = () => {
        console.log("GameSocket connection established.");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed.");
    };

    return socket;
};

const gameSendMessage = (socket, message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.error("WebSocket is not open.");
    }
};

export { connectToWebSocket, gameSendMessage };