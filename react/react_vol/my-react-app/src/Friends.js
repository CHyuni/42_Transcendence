import React, { useEffect, useRef, useState } from "react";
import { useSelector } from 'react-redux';

import FriendCard from "./FriendCard";
import ChatBox from "./ChatBox";
import ApiRequests from "./ApiRequests";

// 사용자 카드 컴포넌트
// state
// 1. available
// 2. playing
// 3. in queue
// 4. offline

const Friends = React.memo(function Friends({ isBlock, friends = [], myProfile }) {
    // console.log("friends prop:", friends);
    const index = useSelector((state) => state.friendReducer.idx);
    const currentFriend = friends.find(friend => friend.id === Number(index));
    const [roomName, setRoomName] = useState(null);
    
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (currentFriend && !isBlock) {
                try {
                    // console.log("currentFriend", currentFriend);
                    const response = await ApiRequests(`/api/chatroom/`,{
                        method: 'POST',
                        body: JSON.stringify({
                            friend_id: currentFriend.id
                        }),                        
                    });
                    setRoomName(response.room);
                } catch (error) {
                    console.error('방 로드 실패:', error);
                } 
            } else {
                setRoomName(null);
            }
        };

        fetchChatHistory();
    }, [currentFriend, isBlock]);
    const scrollableRef = useRef(null);
    const scrollToTop = () => {
        if (scrollableRef.current) {
            scrollableRef.current.scrollTop = 0;
        }
    };
    
    useEffect(() => {
        scrollToTop();
    }, [index]);
    
    // console.log("Current friend found:", currentFriend);
    return (
        <div id="sidebar-users">
            <ul className="list-group no-horizontal-scroll" 
                id="ul-list-user"
                ref={scrollableRef}
            >
                {friends.length > 0 ? (
                    friends.map((user) => (
                        <FriendCard 
                            key={user.id}
                            id={user.id}
                            name={user.name} 
                            status={user.status}
                            rating={user.rating}
                            isBlock={isBlock}
                            myProfile={myProfile}
                        />
                    ))
                ) : (
                    <li className="list-group-item d-flex justify-content-between align-items-center" id="no-list-group">
                        <p className="no-user-tag">Currently has no friends</p>
                    </li>
                )}
            </ul>
            {currentFriend && !isBlock ? 
                <ChatBox 
                    index={index} 
                    name={currentFriend.name}
                    roomName = {roomName}
                    texts={currentFriend.chats || []}  // 채팅 기록이 없다면 빈 배열
                /> 
                : null
            }
        </div>
    );
});

export default Friends;