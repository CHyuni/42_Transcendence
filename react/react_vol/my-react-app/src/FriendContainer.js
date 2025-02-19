import React, { useEffect, useState } from "react";
import Friends from "./Friends";
import "./SideBar.css"

export default function FriendContainer({ requests, selfRefresh }) {
    // console.log("FriendContainer rendered with requests:", requests);
    const onlineFriendsCount = requests.reduce((count, request) => {
        return request.is_online ? count + 1 : count;
    }, 0);

    return (
        <div>
            <div id="sidebar-online-user">
                <div id="sidebar-online-header">
                    <h5 id="sidebar-online-text">Friends({onlineFriendsCount}/{requests.length})</h5>
                </div>
                <Friends 
                    isBlock={0} 
                    friends={requests}
                    selfRefresh= { selfRefresh }
                />
            </div>
        </div>
    );
}