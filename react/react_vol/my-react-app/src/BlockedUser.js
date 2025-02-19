import React, { useEffect, useState } from "react";
import Friends from "./Friends";
export default function BlockedUser({ requests, selfRefresh }) {

    useEffect(() => {
    }, []);

    return (
        <div id="sidebar-online-user">
            <div id="sidebar-online-header">
                <h5 id="sidebar-online-text">Blocked Users({requests.length})</h5>
            </div>
            <Friends isBlock={1}
             friends={requests}
             selfRefresh={ selfRefresh }
             />
        </div>
    );
}