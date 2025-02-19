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
import { ratingUpdate } from "./redux/actions/gameActions";
import { useWebSocket } from "./WebSocketContext";
import { useNavigate } from 'react-router-dom';
import ApiRequests from './ApiRequests'
import Mypage from "./Mypage";

export default function SideBar({ refresh, selfRefresh, gameStartCount, gameRoomId, setGameRoomId, setGameStartCount }) {
    const [loading, setLoading] = useState(true);
    const state = useSelector(state => state.profileReducer.profileIdx);
    const [userProfile, setUserProfile] = useState(null);
    const [users, setUsers] = useState([]);
    const dispatch = useDispatch();
    const { sendMessage } = useWebSocket();
    const cur_mod = useSelector(state => state.modeReducer.mode);
    const [refreshbtn, setRefreshbtn] = useState(0);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingFromRequests, setPendingFromRequests] = useState([]);
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [blockedRequests, setBlockedRequests] = useState([]);
    const navigate = useNavigate();

    const setRefreshbtnCount = () => {
        setRefreshbtn(prevcnt => prevcnt + 1);
    };
    
    useEffect(() => {
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
    }, [refresh, selfRefresh, refreshbtn]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);
        
        return () => clearTimeout(timer);
    }, []);
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const data = await ApiRequests('/api/user/me/profile/');
                // console.log("data: ", data);
                setUserProfile(data);
                if (data) {
                    dispatch(ratingUpdate(data));
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            }
        };
        
        fetchUserProfile();
    }, [refresh, dispatch]);
    
    useEffect(() => {
        if (userProfile) {
            dispatch(ratingUpdate(userProfile))
        }
    }, [refresh, dispatch]);
    
    useEffect(() => {
        const fetchData = async () => {
            const get_status = async () => {
                const response = await ApiRequests('/api/status/me/get-state');
                console.log('message', response.message);
                if (response.message === 'playing') return true;
                return false;
            }
        const initstate = async () => {
            const response_status = await ApiRequests('/api/status/me/state-update/', {
                method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }});
            if (response_status === 'Not Found status')
                    console.error('state-update Failed');
            const response_delete = await ApiRequests('api/match/delete/', { method: 'DELETE' });
            await ApiRequests('/api/user/me/modeUpdate/?init=1');
                    sendMessage({ type: 'refresh' });
        }
            let is_playing = await get_status();
            if (is_playing) return;
            dispatch(modeChange(0))
        initstate();
        }
        fetchData();
    }, []);
    
    const handleMode = async () => {
        const fetchData = async () => {
            const get_status = async () => {
                const response = await ApiRequests('/api/status/me/get-state');
                if (response.message !== 'available') return true;
                return false;
            }
            let is_play = await get_status();
            if (is_play) return;
            dispatch(modeChange(1));
            try {
                await ApiRequests('/api/user/me/modeUpdate/');
            } catch (error) {
                console.error('Failed to fetch modeUpdate:', error);
            }
            sendMessage({ type: "refresh", data: userProfile.username});
        }
        fetchData();
    };
    
    const fetchPendingRequests = async () => {
        try {
            const response_to = await ApiRequests(`/api/friend/?user=${userProfile.userid}&status=pending_to`);
            setPendingRequests(response_to);
            const response_from = await ApiRequests(`/api/friend/?user=${userProfile.userid}&status=pending_from`)
            setPendingFromRequests(response_from);
        } catch (error) {
            console.error('Failed to fetch pending requests:', error);
        }
    };
    
    const fetchAcceptedRequests = async () => {
        try {
            const response = await ApiRequests(`/api/friend/?user=${userProfile.userid}&status=accepted`);
            const modifiedRequests = response.map(responses => ({
                id: userProfile.userid === responses.to_user ? responses.from_user : responses.to_user,
                status: userProfile.userid === responses.to_user ? responses.from_user_status : responses.to_user_status,
                name: userProfile.userid === responses.to_user ? responses.from_username : responses.to_username,
                rating: userProfile.userid === responses.to_user ? responses.from_user_rating : responses.to_user_rating,
                is_online: userProfile.userid === responses.to_user ? responses.from_user_is_online : responses.to_user_is_online
            }));
            modifiedRequests.sort((a, b) => b.is_online - a.is_online);
            setAcceptedRequests(modifiedRequests);
        } catch (error) {
            console.error('Failed to fetch Accepted requests:', error);
        }
    };
    
    const fetchBlockedRequests = async () => {
        try {
            const response = await ApiRequests(`/api/blocked/get?myuid=${userProfile.userid}`);
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
        if (userProfile) {
            fetchPendingRequests();
            fetchBlockedRequests();
            fetchAcceptedRequests();
        }
    }, [selfRefresh, userProfile, refreshbtn]);
    
    const game_mode = useSelector(state => state.modeReducer.mode)
    const [currentPage, setCurrentPage] = useState("none");
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const [hasNavigated, setHasNavigated] = useState(false);

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
                        <Profile selfRefresh={ selfRefresh }/>
                        )}
                    <div id="sidebar-header" onClick={ handleMode }>
                        <h3 id="sidebar-header-text">{ game_mode }</h3>
                    </div>
                    <SideBarUser users={ users } selfRefresh={ setRefreshbtnCount }/> 
                    <FriendContainer requests={acceptedRequests} selfRefresh={ selfRefresh }/>
                    <BlockedUser requests={blockedRequests} selfRefresh={ selfRefresh }/>
                    <PendingUser requests={pendingRequests} requestsFrom={pendingFromRequests} selfRefresh={ selfRefresh }/>
                </div>
                {userProfile && <TopBar userProfile={ userProfile } onPageChange={handlePageChange} /> }
                <Body 
                    state={"none"}
                    user={currentPage}
                    userProfile={userProfile}
                />
                </>
            )}
        </div>
    );
}