import React, { useEffect, useState } from "react";
import { useWebSocket } from "./WebSocketContext";
import "./topbar.css"
import ApiRequests from "./ApiRequests";
import { useNotification } from './NotificationContext';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';


export default function TopBar({ userProfile, onPageChange }) {
    // const reduxProfileImage = useSelector(state => state.profileReducer.profileImage);
    const navigate = useNavigate();
    const { profile_image_base64, profile_image, username } = userProfile || {};
    const { showToastMessage, showConfirmModal } = useNotification();

    const profileImage = profile_image_base64 
    ? `data:image/jpeg;base64,${profile_image_base64}` 
    : (profile_image || "/ksuh.jpg");
    const { sendMessage } = useWebSocket();
    const { closeSocket } = useWebSocket();

    const toggleDropdown = () => {
        const dropdownContent = document.querySelector('.user-dropdown-content');
        if (dropdownContent.style.display === 'block') {
          dropdownContent.style.display = 'none';
        } else {
          dropdownContent.style.display = 'block';
        }
    }
    // console.log('userProfile:', userProfile);

    const handleClick = async () => {
        const response = await ApiRequests('/api/user/get-status/');
        if (response.status != 'available') return;
        navigate("/ai-mode");
    };
    
    const logout = async () => {
        try {
            const response = await ApiRequests('/api/oauth/logout');
            if (response.playing) {
                return ;
            }
            alert("로그아웃 되었습니다.");
            sendMessage({ type: 'refresh' });
            closeSocket();
            window.location.href = '/';
        } catch(error) {
            console.log(error);
        }
    };

    const handleMenuClick = (page) => {
        onPageChange(page, userProfile); // 페이지 변경
        toggleDropdown(); // 드롭다운 닫기
    };
    return (
        <div class="top-bar">
            <div class="user-dropdown-content">
                <li class="user-dropdown-li" onClick={() => handleMenuClick("mypage")}>Mypage</li>
                <li class="user-dropdown-li" onClick={() => handleMenuClick("stats")}>Stats</li>
                <li class="user-dropdown-li" onClick={() => handleMenuClick("blockchain")}>BlockChain</li>
                <li class="user-dropdown-li" onClick={handleClick}>Ai-Mode</li>
                <li class="user-dropdown-li" onClick={logout}>Logout</li>

            </div>
            <img src="/home-logo.jpeg" class="home-logo"/>
            <div class="home-welcome">42 transcendence</div>
            <div class="user-profile-container">
                <div class="user-profile"
                onClick={toggleDropdown}>
                    <div 
                        class="user-img-container"
                    >
                        <img src={profileImage || "/ksuh.jpg"} class="user-img" alt="profile-image"/>
                    </div>
                    <div class="user-content-container">
                        <p class="user-name">{username || 'ksuh'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}