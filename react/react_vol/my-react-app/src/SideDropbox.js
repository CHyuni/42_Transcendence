    import React from "react";
    import { useDispatch } from 'react-redux';
    import { toggleFriend } from './redux/actions/friendActions';
    import { profileFriend } from "./redux/actions/friendActions";

    export default function SideDropBox({ idx, dropdowns }) {
        const dispatch = useDispatch();
        const handleToggle = (cmd) => {
            if (cmd === "Play")
                handlePlay();
            else if (cmd === "Add")
                handleAdd();
            else if (cmd === "Chat")
                handleChat();
            else if (cmd === "Block")
                handleBlock();
            else if (cmd === "Unblock")
                handleUnblock();
            else if (cmd === "Profile")
                handleProfile();
            else
                handleDelete();
        }

        const handlePlay = () => {
            console.log("Play!");
        };

        const handleAdd = () => {
            console.log("Add!");
        };

        const handleChat = () => {
            dispatch(toggleFriend(idx));
        };

        const handleBlock = () => {
            console.log("Block!");
        };

        const handleUnblock = () => {
            console.log("Unblock!");
        };

        const handleProfile = () => {
            dispatch(profileFriend());
        }

        const handleDelete = () => {
            console.log("Delete!");
        };

    return (
        <ul class="dropdown-menu friend-dropdown-container">
            {dropdowns.map((cmd, index) => (
                <li key={index}>
                <div 
                    className="dropdown-item friend-dropdown"
                    onClick={() => handleToggle(cmd)}
                >
                    {cmd}
                </div>
                </li>
            ))}
        </ul>
    );
    }
