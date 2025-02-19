import React, { useEffect, useState } from "react";
import User from "./User";
import CheckBoxDiv from "./CheckBoxDiv";

export default function SideBarUser({ users, selfRefresh }) {
    return (
        <div>
            <div id="sidebar-online-user">
                <div id="sidebar-online-header">
                    <h5 id="sidebar-online-text">
                        Online Users({users.length})
                        <i className="bi bi-arrow-clockwise fs-5" id="online-user-refresh" onClick={selfRefresh}></i>
                    </h5>
                    <CheckBoxDiv />
                </div>
                <User users={users}/>
            </div>
        </div>
    );
}