import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Profile.css";
import { profileFriend } from "./redux/actions/friendActions";
import { toggleFriend } from './redux/actions/friendActions';
import { useWebSocket } from "./WebSocketContext";
import { useNotification } from './NotificationContext';
import { tourCustom } from "./redux/actions/gameActions";
import ApiRequests from "./ApiRequests";

export default function Profile({ selfRefresh, myProfile }) {
    const userData = useSelector(state => state.profileReducer.userData);
    const cur_mod = useSelector(state => state.modeReducer.mode);
    const customUser = useSelector(state => state.tourCustomReducer.userData);
    const custom = useRef(customUser);
    const [customMatch, setCustomMatch] = useState(false);
    const { sendMessage } = useWebSocket();
    const [meProfile, setMeProfile] = useState(false);
    const [related, setRelated] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showToastMessage, showConfirmModal } = useNotification();

    const dispatch = useDispatch();
    
    useEffect(() => {
        custom.current = customUser;
        if (customUser[0]?.user_id) {
            setCustomMatch(true);
        } else {
            setCustomMatch(false);
        }
    }, [customUser]);
    
    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            if (myProfile && userData && myProfile.userid === userData.id) {
                setMeProfile(true);
            } else {
                setMeProfile(false);
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
    }, [userData, selfRefresh])

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

    const handleGameStart = async () => {
        try {
            const response_me = await ApiRequests('/api/status/me/get-state/');
            if (response_me.message === 'available' || (response_me.message === 'in-queue' && customMatch)) {
                const response_other = await ApiRequests(`/api/status/${userData.id}/get-state/`);
                if (response_me.mode != response_other.mode) {
                    alert('상대방과 Mod가 다릅니다.');
                    return;
                }
                if (response_other.message === 'available') {
                    let mode = cur_mod === 'Casual Mod' ? 'casual' : 'tournament'
                    if (response_me.message === 'available') {
                        const response_status = await ApiRequests('/api/status/me/state-update/',  {
                            method: 'PATCH', body: JSON.stringify({ status: 'in-queue' }), headers: { 'Content-Type': 'application/json' }
                        })
                        if (response_status.message === 'Not Found status')
                            alert('오류 발생');
                        sendMessage({ type: 'refresh' });
                        if (mode === 'tournament' && !customMatch) {
                            let temp = await showConfirmModal(
                                '사용 할 닉네임을 입력해주세요.',
                                (inputText) => {
                                    return inputText;
                                },
                                () => {
                                    return 'cancle'
                                },
                                'tournament'
                            )
                            try {   

                                const response = await ApiRequests(`/api/validate/?nickname=${encodeURIComponent(temp)}`, {
                                    method: 'GET',
                                });
                            } catch (error) {
                                alert('입력 형식에 오류가 있습니다.');
                                await ApiRequests('/api/status/me/state-update/',  {
                                    method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }
                                })
                            }
                            if (temp === 'cancle') return;
                            if (temp === '') temp = myProfile.username;
                            dispatch(tourCustom(0, [{ user_id: myProfile.userid, tournament_name: temp }]));
                        }
                    }
                    sendMessage({ type: "game_request", from_user: myProfile.userid, to_user: userData.id, mode: mode});
                } else if (response_other.message === 'in-queue') {
                    alert('상대방이 다른 작업 중 입니다.');
                } else {
                    alert('상대방이 게임 진행 중 입니다.');
                }
            }else if (response_me.message === 'in-queue') {
                alert('이미 요청 진행 중 입니다.');
            } else {
                alert('현재 게임 진행 중 입니다.')
            }
        } catch (error) {
            console.error('Failed to game', error);
        }
    };

    const getTimeDifferenceMinutes = (lastLoginTime) => {
        const now = new Date();
        const lastLoginDate = new Date(lastLoginTime);
    
        const timeDifferenceMilliseconds = now.getTime() - lastLoginDate.getTime();
        const timeDifferenceMinutes = Math.round(timeDifferenceMilliseconds / (1000 * 60));
    
         if (timeDifferenceMinutes === 0) {
            return "Less than a minute ago"
         } else {
             return `${timeDifferenceMinutes} minutes ago`;
        }
    };
    return (
        <div class="profile-container">
            <ProfileHeader 
                meProfile={meProfile} 
                handleClose={handleClose} 
                related={related} 
                blocked={blocked} 
                toggleDropdown={toggleDropdown}
            />
            <div class="profile-main">
                <div class="profile-image-container">
                    <div class="profile-image-box">
                        <img class="profile-image" src={ userData.image } alt="profile image" />
                        <div class="profile-image-userid">
                            { userData.name }
                            {meProfile ? (
                                <></>
                            ) : (
                                <>
                                {!related ? (
                                    <>
                                        <button 
                                            class="add-btn"
                                            onClick={handleFriendRequest}
                                        >
                                        <img src="/add-friend.png" alt="friend add icon" class="icon"/>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            class="delete-btn"
                                            onClick={handleFriendRemove}
                                        >
                                        <img src="/delete-friend.png" alt="friend delete icon" class="icon"/>
                                        </button>
                                    </>
                                )}
                                {blocked? (
                                    <>
                                        <button
                                            class="unblock-btn"
                                            onClick={handleUnBlock}
                                        >
                                        <img src="/unblock.png" alt="friend unblock icon" class="icon"/>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            class="block-btn"
                                            onClick={handleFriendBlocked}
                                        >
                                        <img src="/block-friend.png" alt="friend block icon" class="icon"/>
                                        </button>
                                    </>
                                )}
                                </>
                            )}
                        </div>
                        { userData.is_online ? (
                            <>
                                <br></br>
                                <div class="profile-image-login">🟢 online</div>
                            </>
                        ) : (
                            <>
                                <div class="profile-image-login">Last login</div>
                                <div class="profile-image-login">{getTimeDifferenceMinutes(userData.last_logins)}</div>
                            </>
                        )}
                    </div>
                </div>
                <div class="profile-content">
                    <div class="profile-content-box-top">
                        <div class="profile-content-box" id="profile-rating">
                            <div class="profile-rating-top">Current</div>
                            <div class="profile-record"> { userData.rating } </div>
                        </div>
                        <div class="profile-content-box" id="profile-rating">
                            <div class="profile-rating-top">Highest</div>
                            <div class="profile-record"> { userData.top_rating } </div>
                        </div>
                    </div>
                    <div class="profile-content-box-top">
                        <div class="profile-content-box" id="profile-rating">
                            <div class="profile-record-top">Casual</div>
                            <div class="profile-record"> { userData.casual_win }W { userData.casual_lose }L ({
                                (userData.casual_win + userData.casual_lose) == 0
                                    ? "0%"
                                    : Math.round(
                                        (userData.casual_win / (userData.casual_win + userData.casual_lose)) *
                                            100
                                    ) + "%"
                                })
                            </div>
                        </div>
                        <div class="profile-content-box" id="profile-rating">
                            <div class="profile-record-top">Tournament</div>
                            <div class="profile-record">{ userData.tournament_win }W { userData.tournament_lose }L ({
                                (userData.tournament_win + userData.tournament_lose) == 0
                                    ? "0%"
                                    : Math.round(
                                        (userData.tournament_win / (userData.tournament_win + userData.tournament_lose)) *
                                            100
                                    ) + "%"
                                })
                            </div>
                        </div>
                    </div>
                    <div class="profile-content-box-top">
                        <div class="profile-content-box">
                            <div class="profile-record-top" id="search-profile-content">Highest Winning Streak</div>
                            <div class="profile-record"> { userData.winning } </div>
                        </div>
                    </div>
                </div>
            </div>
            {meProfile ? (
                <></>
            ) : (
                <>
                    <div class="profile-bottom">
                        <div class="btn-container"><button onClick={handleGameStart}>Play</button></div>
                    </div>
                </>
            )}
        </div>
    );
}