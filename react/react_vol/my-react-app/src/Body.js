import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./body.css"
import TeamCard from "./TeamCard";
import Mypage from "./Mypage";
import Stats from "./Stats";
import TournamentDisplay from "./TournamentDisplay";
import Chain from "./Chain";
import { useWebSocket } from "./WebSocketContext";
import { useNavigate } from 'react-router-dom';
import ApiRequests from "./ApiRequests";
import { useNotification } from './NotificationContext';
import { tournaReducer } from "./redux/reducers/gameReducer";
import { tourCustom } from "./redux/actions/gameActions";


const jpgs = [
    {
        name: "changhyu",
        src: "https://cdn.intra.42.fr/users/82dd359cc4e3dd13242502b5348fa11d/changhyu.jpg",
        stack: "django"
    },
    {
        name: "jajo",
        src: "https://cdn.intra.42.fr/users/203381a89cf52804735c9d106de60cfe/jajo.jpg", 
        stack: "blockchain"
    },
    {
        name: "ksuh",
        src: "https://cdn.intra.42.fr/users/3e737c9d6968b0d2780bab948cd80e27/ksuh.jpg", 
        stack: "react"
    },
    {
        name: "myeochoi",
        src: "https://cdn.intra.42.fr/users/ed3ab73ac607497d40bde2a87dc14f71/myeochoi.jpg",
        stack: "django"
    }
]

export default function Body( { state, user, userProfile } ) {
    const { sendMessage } = useWebSocket();
    const cur_mod = useSelector(state => state.modeReducer.mode);
    const { showToastMessage, showConfirmModal } = useNotification();
    const dispatch = useDispatch();
    const matched = useSelector(state => state.tournaReducer.start);
    const customUser = useSelector(state => state.tourCustomReducer.userData);
    const custom = useRef(customUser);
    const [customMatch, setCustomMatch] = useState(false);
    const { userData } = useSelector(state=> state.tournaReducer);

    useEffect(() => {
        custom.current = customUser;
        if (customUser[0]?.user_id) {
            setCustomMatch(true);
        } else {
            setCustomMatch(false);
        }
    }, [customUser]);

    const handleGameStart = async () => {
        const response = await ApiRequests('/api/match/start/')
        if (response.playing) return;
        if (response.status === 'matched') {
            sendMessage({ type: 'Casual_matched', otheruid: response.match_user_id, otherusername: response.username})
        } else if (response.status === 'matching') {
            showToastMessage('매칭이 시작 되었습니다.', 3000, 'notice');
            const response_status = await ApiRequests('/api/status/me/state-update/', {
                method: 'PATCH', body: JSON.stringify({ status: 'in-queue' }), headers: { 'Content-Type': 'application/json' }})
            if (response_status === 'Not Found status')
                    console.error('state-update Failed')
            sendMessage({ type: 'refresh' });
        } else if (response.status === 'already') {
            showConfirmModal(
                '매칭을 취소 하시겠습니까?',
                async () => {
                    const response_status = await ApiRequests('/api/status/me/state-update/', {
                        method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }});
                    if (response_status === 'Not Found status')
                            console.error('state-update Failed');
                    const response_delete = await ApiRequests('api/match/delete/', { method: 'DELETE' });
                    if (response_delete.message === 'no matching found')
                        console.error('matching delete failed');
                    sendMessage({ type: 'refresh' });
                    alert('취소 완료');
                },
                () => {
                }
            )
        }
    };

    const handleTournament = async () => {
        const check = await ApiRequests('/api/match/check/');
        if (check.status === 'already') {
            await showConfirmModal(
                '매칭을 취소 하시겠습니까?',
                async () => {
                    const response_status = await ApiRequests('/api/status/me/state-update/', {
                        method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }});
                    if (response_status === 'Not Found status')
                            console.error('state-update Failed');
                    const response_delete = await ApiRequests('api/match/delete/', { method: 'DELETE' });
                    if (response_delete.message === 'no matching found')
                        console.error('matching delete failed');
                    sendMessage({ type: 'refresh' });
                    alert('취소 완료');
                },
                () => {
                }
            )
            return;
        }
        const temp = await showConfirmModal(
            '사용 할 닉네임을 입력해주세요.',
            (inputText) => inputText,
            () => 'cancle',
            'tournament'
            );
            
        try {   

            const response = await ApiRequests(`/api/validate/?nickname=${encodeURIComponent(temp)}`, {
                method: 'GET',
            });
            // console.log("res",response);
        } catch (error) {
            alert('입력 형식에 오류가 있습니다.');
            temp = "cancle"
            // console.error('닉네임 검증 실패:', error);
        }
        
        if (temp === 'cancle') return;
        const response = await ApiRequests('/api/match/tournament/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ temp })
        });
        if (response.status === 'matching') {
            showToastMessage('매칭이 시작 되었습니다.', 3000, 'notice');
            const response_status = await ApiRequests('/api/status/me/state-update/', {
                method: 'PATCH', body: JSON.stringify({ status: 'in-queue' }), headers: { 'Content-Type': 'application/json' }})
            if (response_status === 'Not Found status')
                    console.error('state-update Failed')
            sendMessage({ type: 'refresh' });
        } else if (response.status === 'matched') {
            showToastMessage('매칭 완료', 3000, 'notice');
            sendMessage({ type: 'tourna_match', matched_users: response.matched_users });
        }
    }

    const handlecancle = async () => {
        await showConfirmModal(
            '매칭을 취소 하시겠습니까?',
            async () => {
                const response_status = await ApiRequests('/api/status/me/state-update/', {
                    method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }});
                if (response_status === 'Not Found status')
                        console.error('state-update Failed');
                const response_delete = await ApiRequests('api/match/delete/', { method: 'DELETE' });
                if (response_delete.message === 'no matching found')
                    console.error('matching delete failed');
                sendMessage({ type: 'refresh' });
                alert('취소 완료');
            },
            () => {
            }
        )
        dispatch(tourCustom(1));
    }

    return (
        !matched ? (
            <>
                <div class="body">
                    <div class="game-button-container">
                        {customMatch ? (
                            <>
                                <button class="game-button" onClick={handlecancle}>
                                        <p class="game-button-p">{customUser.length}/4</p>
                                </button>
                            </>
                        ) : (
                            <>
                                {cur_mod === 'Casual Mod' ? (
                                    <button class="game-button" onClick={handleGameStart}>
                                        <p class="game-button-p">Start Game</p>
                                    </button>
                                ) : (
                                    <button class="game-button" >
                                        <p class="game-button-p" onClick={handleTournament}>Start Game</p>
                                    </button>
                                )}
                            </>
                        )}
                        
                    </div>
                    {
                        user !== "mypage" &&
                        user !== "stats" &&

                        <></>
                    }
                    {
                        user === "none"
                        ?
                        <>
                            <div class="team-info-container">
                                <div class="team-header">
                                    Team Gyeongsan
                                </div>
                                <div class="team-container">
                                {
                                    jpgs.map((jpg, index) => (
                                        <TeamCard 
                                            key={index}
                                            jpg={jpg.src} 
                                            name={jpg.name}
                                            stack={jpg.stack}
                                        />
                                    ))
                                }
                                </div>
                            </div>
                        </>
                        : user === "mypage"
                        ?
                        <Mypage userProfile={userProfile}/>
                        : user === "stats"
                        ?
                        <Stats userProfile={userProfile} user={user}/>
                        : user === "blockchain"
                        ?
                        <Chain userProfile={userProfile} user={user}/>
                        :
                        <></>
                    }
                </div>        
            </>
        ) : (
            <>
                <div className='body'>
                    <div>
                        <h1 className='tournament-head'>Tournament</h1>
                        <div className='tournament-container'>
                            <div className='left-match'>
                                <div className='match-table'>
                                    <div className='user-box'><span>{userData?.user0_name || ""}</span></div>
                                    <div className="vs">⚔️</div>
                                    <div className='user-box'><span>{userData?.user1_name || ""}</span></div>
                                </div>
                            </div>
                            <div className='win-player'>
                                <div className='win-table'>
                                    <div className='user-box left-winner'><span>{userData?.left_win || 'winner'}</span></div>
                                    <div className="vs">⚔️</div>
                                    <div className='user-box right-winner'><span>{userData?.right_win || 'winner'}</span></div>
                                </div>
                            </div>
                            <div className='right-match'>
                                <div className='match-table'>
                                    <div className='user-box'><span>{userData?.user2_name || ""}</span></div>
                                    <div className="vs">⚔️</div>
                                    <div className='user-box'><span>{userData?.user3_name || ""}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    );
}
