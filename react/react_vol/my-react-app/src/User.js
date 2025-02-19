import React, { useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import UserCard from './UserCard';

export default function User({ users }) {
    const button1 = useSelector((state) => state.checkboxReducer.availChecked);
    const button2 = useSelector((state) => state.checkboxReducer.gameChecked);
    const button3 = useSelector((state) => state.checkboxReducer.queueChecked);

    

    const filteredUsers = users.filter((user) => 
                        (user.status === "available" && button1) ||
                        (user.status === "playing" && button2) ||
                        (user.status === "in-queue" && button3)
                        );
    const scrollableRef = useRef(null);
    const scrollToTop = () => {
        if (scrollableRef.current) {
            scrollableRef.current.scrollTop = 0; // 스크롤 위치를 0으로 설정
          }
    };

    useEffect(() => {
        scrollToTop();
            }, [button1, button2, button3]);

  return (
    <div id="sidebar-users">
        <ul className="list-group no-horizontal-scroll" 
            id="ul-list-user"
            ref={scrollableRef}
        >
            {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <UserCard name={user.username} 
                            id={user.userid}
                            status={user.status} 
                            rating={user.rating}
                            top_rating={user.top_rating}
                            casual_win={user.casual_win}
                            casual_lose={user.casual_lose}
                            tournament_win={user.tournament_win}
                            tournament_lose={user.tournament_lose}
                            image={user.image}
                            winning={user.winning}
                            last_logins={user.last_logins}
                            is_online={user.is_online}
                    />
            ))
            ) : (
                <li className="list-group-item d-flex justify-content-between align-items-center" id="no-list-group">
                    <p className="no-user-tag">No User Found</p>
                </li>
            )
            }
        </ul>
    </div>
  );
}