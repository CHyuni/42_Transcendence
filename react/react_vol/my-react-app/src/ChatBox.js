import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { toggleFriend } from './redux/actions/friendActions';
import './ChatBox.css';
import { useWebSocket } from "./WebSocketContext";
import ApiRequests from "./ApiRequests";

export default function ChatBox({ index, name , roomName}) {
    // console.log("name", roomName);
    const dispatch = useDispatch();
    const [position, setPosition] = useState({ x: 390, y: 550 }); // 초기 위치
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const userData = useSelector(state => state.userReducer.userData);

    const wsRef = useRef(null);
    const chatBoxRef = useRef(null);

    const scrollToBottom = () => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchPreviousMessages = async () => {
            try {
                const response = await ApiRequests(`/api/chatroommessage/?room_name=${roomName}`, {
                    method: 'GET'
                });
                // console.log("Fetched messages:", userData);
    
                // userData[0]를 문자열로 변환
                const userIdStr = String(userData.userid);
    
                const previousMessages = response.map(msg => ({
                    id: msg.id,
                    text: msg.message,
                    sender: String(msg.sender) === userIdStr ? 'user' : 'other'
                }));
                // console.log("sender:", response);
                
                setMessages(previousMessages);
                scrollToBottom();
            } catch (error) {
                console.error('이전 메시지 불러오기 실패:', error);
            }
        };
    
        if (roomName) {
            fetchPreviousMessages();
        }
    }, [roomName, userData]);
    useEffect(() => {
        if (roomName) {
            wsRef.current = new WebSocket(`wss://${window.location.host}/ws/chat/${roomName}/`);
            
            wsRef.current.onopen = () => {
                console.log("WebSocket connected to room:", roomName);
            };
            wsRef.current.onmessage = (event) => {
                // console.log("Received data:", event.data);  // 받은 데이터 확인
                const data = JSON.parse(event.data);
                
                // 새 메시지 추가
                setMessages(prevMessages => [...prevMessages, {
                    id: prevMessages.length + 1,
                    text: data.message, 
                    sender: 'other' 
                }]);
            };
        }
    }, [roomName]);
    
    // 메시지 전송 시에도 로그 추가
    const handleSendMessage = () => {
        if (message.trim() !== '' && roomName && wsRef.current) {
            const newMessage = {
                id: messages.length + 1,
                text: message,
                sender: 'user'
            };
    
            setMessages(prevMessages => [...prevMessages, newMessage]);
            
            // WebSocket으로 전송
            wsRef.current.send(JSON.stringify({
                message: message
            }));
            try {

                const response = ApiRequests('/api/chatroommessage/', {
                    method: 'POST',
                    body: JSON.stringify({
                        room_name: roomName,
                        message: message
                    })
                });
                // console.log("api로 받은메시지", response);
            } catch (error) {
                // console.error('메시지 저장 실패:', error);
            }
            setMessage('');
        }
    };


    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };
    
    const handleMouseDown = (e) => {
        // 헤더 부분에서만 드래그 가능하도록
        if (e.target.className === 'chat-header') {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    const idx = useSelector(state => state.friendReducer.idx);
    const [showWarning, setShowWarning] = useState(true);

    const handleClose = () => {
        dispatch(toggleFriend(-1));
    };

    

    const scrollableRef = useRef(null);
    const scrollToTop = () => {
        if (scrollableRef.current) {
            scrollableRef.current.scrollTop = 0; // 스크롤 위치를 0으로 설정
          }
    };

    useEffect(() => {
        scrollToTop();
            }, [index]);

    useEffect(() => {
        setShowWarning(true);
        const timer = setTimeout(() => {
            setShowWarning(false); // 일정 시간이 지나면 경고 메시지를 숨긴다
        }, 8000); // 5초 후에 메시지를 숨긴다
        return () => clearTimeout(timer); // 컴포넌트가 언마운트되거나 타이머가 변경되면 타이머를 정리한다
    }, [idx]);

  return (
        <div
            className="chat-container"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            {/* { showWarning &&
                <div className="chat-warning"> 
                    The Game Is About To Start... Get Ready!
                </div>
            } */}
            <div
                className="chat-header"
                onMouseDown={handleMouseDown}
                style={{ cursor: 'move' }} 
            >
                {name}
                <button type="button" 
                    class="btn-close" 
                    id="chat-close" 
                    aria-label="Close"
                    onClick={handleClose}
                    >
                </button>
            </div>
            <hr className="chat-header-line"/>
            <div className="chat-box" ref={chatBoxRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="input-container">
                <input 
                    type="text" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요" 
                />
                <button onClick={handleSendMessage}>전송</button>
            </div>
        </div>
  );
}