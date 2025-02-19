import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Profile.css";
import { profileFriend } from "./redux/actions/friendActions";
import { toggleFriend } from './redux/actions/friendActions';
import { useWebSocket } from "./WebSocketContext";
import { useNotification } from './NotificationContext';
import ApiRequests from "./ApiRequests";
import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';
import ProfileStats from './ProfileStats';
import ProfileActions from './ProfileActions';
import { useGameActions } from "./gameUtils";

export default function Profile({ selfRefresh, myProfile }) {
    const userData = useSelector(state => state.profileReducer.userData);
    const cur_mod = useSelector(state => state.modeReducer.mode);
    const customUser = useSelector(state => state.tourCustomReducer.userData);
    const [customMatch, setCustomMatch] = useState(false);
    const { sendMessage } = useWebSocket();
    const [related, setRelated] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showToastMessage, showConfirmModal } = useNotification();
    const { handleGameStart } = useGameActions({ userData, customMatch, cur_mod, myProfile });

    const dispatch = useDispatch();

    const meProfile = myProfile && userData && myProfile.userid === userData.id;
    useEffect(() => {
        setCustomMatch(customUser[0]?.user_id ? true : false);
    }, [customUser]);
    
    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            if (!meProfile) {
                const response_related = await ApiRequests(`/api/related/friend/?myuid=${myProfile.userid}&otheruid=${userData.id}`);
                if (response_related.is_related) {
                    setRelated(true);
                } else {
                    setRelated(false);
                }
                const response_blocked = await ApiRequests(`/api/blocked/create/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        myuid: myProfile.userid,
                        otheruid: userData.id,
                        mode: 'check'
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response_blocked.blocked) {
                    setBlocked(true);
                } else {
                    setBlocked(false);
                }
            }
            setLoading(false);
        }
        fetchRelated()
    }, [userData, selfRefresh, meProfile])

    const handleFriendRequest = async () => {
        try {
            const response_check = await ApiRequests('/api/blocked/create/', {
                method: 'POST',
                body: JSON.stringify({
                    myuid: myProfile.userid,
                    otheruid: userData.id,
                    mode: 'checkBidirectional'
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (response_check.message === 'isBlocked') {
                alert('차단된 상대 입니다.')
                return;
            } else if (response_check.message === 'otherblock') {
                showToastMessage(`${userData.name}님에게 친구 요청을 보냈습니다.`, 3000, 'notice');
                return;
            }
            const response = await ApiRequests(`/api/related/friend/?myuid=${myProfile.userid}&otheruid=${userData.id}`);
            if (response.message) {
                alert('이미 요청이 진행 중 입니다.');
            } else if (response.NoMatching) {
                sendMessage({ type: 'create_friend_request', to_user_id: userData.id})  
            }
        } catch (error) {
            console.error('Faild to fetch related find requests:', error);
        }
    };

    const handleFriendRemove = async () => {
        try {
            await ApiRequests(`/api/related/remove/?myuid=${myProfile.userid}&otheruid=${userData.id}`, {
                method: 'DELETE',
            });
            sendMessage({ type: "selfRefresh", users: [{ id : myProfile.userid}, { id : userData.id}]});
            const response_blocked = await ApiRequests(`/api/blocked/create/`, {
                method: 'POST',
                body: JSON.stringify({
                    myuid: myProfile.userid,
                    otheruid: userData.id,
                    mode: 'check'
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response_blocked.blocked)
                alert('친구 삭제 완료.');
        } catch (error) {
            console.error('Failed to fetch remove requests:', error);
        }
    }

    const handleFriendBlocked = async () => {
        try {
            const response = await ApiRequests(`/api/blocked/create/`, {
                method: 'POST',
                body: JSON.stringify({
                    myuid: myProfile.userid,
                    otheruid: userData.id,
                    mode: 'create'
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.message === 'addBlocked') {
                sendMessage({ type: "selfRefresh", users: [{ id : myProfile.userid}, { id : userData.id}]})
                const response_related = await ApiRequests(`/api/related/friend/?myuid=${myProfile.userid}&otheruid=${userData.id}`);
                if (response_related.is_related)
                    handleFriendRemove();
                alert(`${userData.name}님을 차단 하였습니다.`);
            }
            else if (response.message === 'isBlocked')
                alert('이미 차단된 사용자 입니다.')
        } catch (error) {
            console.error('Failed to fetch blocked requests:', error);
        }
    };

    const handleUnBlock = async () => {
        try {
            const response = await ApiRequests(`/api/blocked/unblock/?myuid=${myProfile.userid}&otheruid=${userData.id}`, {
                method: 'DELETE',
            });
            sendMessage({ type: "selfRefresh", users: [{ id : myProfile.userid}, { id : userData.id}]});
            alert('차단 해제 완료.');
        } catch (error) {
            console.error('Failed to fetch unblock requests:', error);
        }
    }

    const handleClose = () => {
        dispatch(profileFriend());
    };

    const toggleDropdown = () => {
        const dropdownContent = document.querySelector('.dropdown-content');
        if (dropdownContent.style.display === 'block') {
          dropdownContent.style.display = 'none';
        } else {
          dropdownContent.style.display = 'block';
        }
    }

    const handleChat = () => {
        dispatch(toggleFriend(userData.id));
        toggleDropdown();
    };

    if (loading) {
        return null;
    }

    return (
        <div class="profile-container">
            <ProfileHeader 
                meProfile={meProfile} 
                handleClose={handleClose} 
                related={related} 
                blocked={blocked} 
                toggleDropdown={toggleDropdown}
                handleChat={handleChat}
                handleFriendRequest={handleFriendRequest}
                handleFriendBlocked={handleFriendBlocked}
                handleUnBlock={handleUnBlock}
            />
            <div class="profile-main">
                <ProfileInfo 
                    meProfile={meProfile} 
                    userData={userData} 
                    handleFriendRequest={handleFriendRequest} 
                    handleFriendRemove={handleFriendRemove} 
                    handleFriendBlocked={handleFriendBlocked} 
                    handleUnBlock={handleUnBlock} 
                    related={related} 
                    blocked={blocked} 
                />
                <ProfileStats userData={userData} />
            </div>
            {!meProfile && (
                <ProfileActions 
                    meProfile={meProfile} 
                    handleGameStart={handleGameStart}
                />
            )}
        </div>
    );
}