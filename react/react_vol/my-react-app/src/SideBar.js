import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./SideBar.css"
import Spinner from "./Spinner"
import SideBarUser from "./SideBarUser";
import FriendContainer from "./FriendContainer";
import BlockedUser from "./BlockedUser";
import PendingUser from "./PendingUser";
import Profile from "./Profile";
import TopBar from "./TopBar";
import Body from "./Body";
import { modeChange } from "./redux/actions/gameActions";
import { useWebSocket } from "./WebSocketContext";
import { useNavigate } from 'react-router-dom';
import ApiRequests from './ApiRequests'
import { useNotification } from './NotificationContext';

export default function SideBar({ refresh, selfRefresh, selfRefreshbtn, gameStartCount, gameRoomId, setGameRoomId, setGameStartCount, myProfile }) {
    const [loading, setLoading] = useState(true);
    const state = useSelector(state => state.profileReducer.profileIdx);
    const [users, setUsers] = useState([]);
    const dispatch = useDispatch();
    const { sendMessage } = useWebSocket();
    const cur_mod = useSelector(state => state.modeReducer.mode);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingFromRequests, setPendingFromRequests] = useState([]);
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [blockedRequests, setBlockedRequests] = useState([]);
    const { showToastMessage, showConfirmModal } = useNotification();
    const navigate = useNavigate();
    
    useEffect(() => {
        // 현재 온라인 유저 목록과 해당 유저의 profile 정보를 담음, 온라인 유저 표시에 사용될 데이터
        const fetchUsers = async () => {
            try {
                const data = await ApiRequests('/api/user/online-users/');
                const processedUsers = data.users.filter(user => user.mode === cur_mod).map((user, index) => ({
                    username: user.username,
                    userid: user.userid,
                    casual_win: user.casual_win || 0,
                    casual_lose: user.casual_lose || 0,
                    tournament_win: user.tournament_win || 0,
                    tournament_lose: user.tournament_lose || 0,
                    rating: user.rating || 800,
                    top_rating: user.top_rating || 800,
                    status: user.status || "available",
                    image: user.profile_image_base64
                    ? `data:image/jpeg;base64,${user.profile_image_base64}` 
                    : user.profile_image,
                    about_me: user.about_me,
                    totp_enabled: user.totp_enabled,
                    is_online: user.is_online,
                    last_logins: user.last_logins,
                    winning: user.winning
                }));
                setUsers(processedUsers);                
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, [refresh, selfRefresh]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        
        return () => clearTimeout(timer);
    }, []);
    
    // 페이지가 리렌더링 될때, 매칭이 완료된 playing 상태나 게임 중 일 경우 무시 이외에는 상태: 대기중, 매칭 중이였다면 해당 매칭 취소 처리
    useEffect(() => {
        const fetchData = async () => {
            if (myProfile.status === 'playing') return;
            const initstate = async () => {
                const response_status = await ApiRequests('/api/status/me/state-update/', {
                    method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }});
                if (response_status === 'Not Found status')
                        console.error('state-update Failed');
                await ApiRequests('api/match/delete/', { method: 'DELETE' });
                await ApiRequests('/api/user/me/modeUpdate/?init=1');
                sendMessage({ type: 'refresh' });
            }
            dispatch(modeChange(0))
            initstate();
        }
        fetchData();
    }, []);
    
    // Custom, Tournament 모드 변경
    const handleMode = async () => {
        if (myProfile !== 'available') {
            await showToastMessage('매칭 및 게임 중에는 모드 변경이 불가능 합니다.', 2000, 'notice');
            return;
        }
        dispatch(modeChange(1));
        try {
            await ApiRequests('/api/user/me/modeUpdate/');
        } catch (error) {
            console.error('Failed to fetch modeUpdate:', error);
        }
        sendMessage({ type: "refresh", data: myProfile.username});
    };
    
    // 보낸 친구 요청, 받은 친구 요청 데이터를 받음
    const fetchPendingRequests = async () => {
        try {
            const response_to = await ApiRequests(`/api/friend/?user=${myProfile.userid}&status=pending_to`);
            setPendingRequests(response_to);
            const response_from = await ApiRequests(`/api/friend/?user=${myProfile.userid}&status=pending_from`)
            setPendingFromRequests(response_from);
        } catch (error) {
            console.error('Failed to fetch pending requests:', error);
        }
    };
    
    // 현재 나와 친구 관계인 유저들의 데이터를 받음, 온라인 여부로 내림차순 정렬
    const fetchAcceptedRequests = async () => {
        try {
            const response = await ApiRequests(`/api/friend/?user=${myProfile.userid}&status=accepted`);
            const modifiedRequests = response.map(responses => ({
                id: myProfile.userid === responses.to_user ? responses.from_user : responses.to_user,
                status: myProfile.userid === responses.to_user ? responses.from_user_status : responses.to_user_status,
                name: myProfile.userid === responses.to_user ? responses.from_username : responses.to_username,
                rating: myProfile.userid === responses.to_user ? responses.from_user_rating : responses.to_user_rating,
                is_online: myProfile.userid === responses.to_user ? responses.from_user_is_online : responses.to_user_is_online
            }));
            modifiedRequests.sort((a, b) => b.is_online - a.is_online);
            setAcceptedRequests(modifiedRequests);
        } catch (error) {
            console.error('Failed to fetch Accepted requests:', error);
        }
    };
    
    // 본인이 차단한 유저 목록을 받음
    const fetchBlockedRequests = async () => {
        try {
            const response = await ApiRequests(`/api/blocked/get?myuid=${myProfile.userid}`);
            const modifiedRequests = response.map(responses => ({
                id: responses.blocked_user_id,
                name: responses.blocked_user_id__username,
            }));
            setBlockedRequests(modifiedRequests);
        } catch (error) {
            console.error('Failed to fetch Blocked requests:', error);
        }
    };
    
    useEffect(() => {
        if (myProfile) {
            fetchPendingRequests();
            fetchBlockedRequests();
            fetchAcceptedRequests();
        }
    }, [selfRefresh, myProfile]);
    
    const game_mode = useSelector(state => state.modeReducer.mode)
    const [currentPage, setCurrentPage] = useState("none");
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const [hasNavigated, setHasNavigated] = useState(false);

    // 하위 컴포넌트에서 게임시작을 알렷을 경우 해당 게임으로 입장
    useEffect(() => {
        if (gameStartCount > 0 && gameRoomId) {
            navigate(`/game/${gameRoomId}`);
            setHasNavigated(true);
            setGameStartCount(0);
            setGameRoomId(null);
        }

        return () => {
            if (hasNavigated) {
                setGameStartCount(0);
                setGameRoomId(null);
                setHasNavigated(false);
            }
        };
    }, [gameStartCount]);

    return (
        <div>
            { loading ? (
                <Spinner/>
                ) : (
                    <>
                <div id="sidebar">
                    {state && (
                        <Profile selfRefresh={ selfRefresh } myProfile={ myProfile }/>
                        )}
                    <div id="sidebar-header" onClick={ handleMode }>
                        <h3 id="sidebar-header-text">{ game_mode }</h3>
                    </div>
                    <SideBarUser users={ users } selfRefresh={ selfRefreshbtn }/> 
                    <FriendContainer requests={acceptedRequests} selfRefresh={ selfRefresh } myProfile={ myProfile }/>
                    <BlockedUser requests={blockedRequests} selfRefresh={ selfRefresh } myProfile={ myProfile }/>
                    <PendingUser requests={pendingRequests} requestsFrom={pendingFromRequests} selfRefresh={ selfRefresh } myProfile={ myProfile }/>
                </div>
                {myProfile && <TopBar myProfile={ myProfile } onPageChange={handlePageChange} /> }
                <Body
                    state={"none"}
                    user={currentPage}
                    myProfile={myProfile}
                />
                </>
            )}
        </div>
    );
}