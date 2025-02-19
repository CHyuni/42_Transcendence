import React, { useEffect, useState } from "react";
import "./game.css"
import { useLocation } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import ApiRequests from "./ApiRequests";
import { useWebSocket } from "./WebSocketContext";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { tourCustom, tournamentUpdate } from './redux/actions/gameActions';

export default function Game({ myProfile }) {
    const { roomId } = useParams();
    const [gameResult, setGameResult] = useState(null);
    const [user1_score, setUser1Score] = useState(0);
    const [user2_score, setUser2Score] = useState(0);
    const { sendMessage } = useWebSocket();
    const { mode } = useSelector(state => state.modeReducer);
    const { userData } = useSelector(state=> state.tournaReducer);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const handleGameEnd = (event) => {
            setGameResult(event.detail.result);
            setUser1Score(event.detail.user1_score);
            setUser2Score(event.detail.user2_score);
            if (user1_score == user2_score && gameResult === 'win') {
                user1_score = myProfile.userid == Number(window.player1) ? 3 : 0;
                user2_score = myProfile.userid == Number(window.player2) ? 3 : 0;
            }
        };
        window.addEventListener('gameEnd', handleGameEnd);
        // `pong.js` 동적으로 로드
        const script = document.createElement("script");
        script.src = "/game/pong.js"; // public 경로를 기준으로 설정
        script.async = true;
    
        // 스크립트를 DOM에 추가
        document.body.appendChild(script);
    
        // 클린업 함수: 스크립트 제거
        return () => {
            window.removeEventListener('gameEnd', handleGameEnd);
            if (window.pongGameSocket) {
                window.pongGameSocket.close();
                delete window.pongGameSocket;
                delete window.player1;
                delete window.player2;
                delete window.isMatch;
            }
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);
    
    useEffect(() => {
        const updateStatus = async () => {
            const exit_game = async () => {
                const response_status = await ApiRequests('/api/status/me/state-update/',  {
                    method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }})
                    if (response_status === 'Not Found status')
                    console.error('state-update Failed')
                sendMessage({ type: 'refresh' });
            }
            if (gameResult) {
                try {
                    let winner;
                    let loser;
                    if (gameResult === 'win') {
                        winner = myProfile.userid;
                        loser = window.player1 == myProfile.userid ? window.player2 : window.player1;
                    } else {
                        loser = myProfile.userid;
                        winner = window.player1 == myProfile.userid ? window.player2 : window.player1;
                    }
                    let gametype = userData.match === true ? 'match' : 'custom';
                    let block_type = gametype === 'match' ? 1 : 2;
                    if (mode === 'Tournament Mod') {
                        let myidx;
                        for (let i = 0; i < 4; ++i) {
                            if (userData[`user${i}`] === myProfile.userid) {
                                myidx = i;
                                break;
                            }
                        }
                        if (gameResult === 'lose') {
                            dispatch(tournamentUpdate(2));
                            dispatch(tourCustom(1));
                            await exit_game();
                        }
                        else {
                            const response_p1 = await ApiRequests(`/api/user/${Number(window.player1)}/profile/`);
                            const response_p2 = await ApiRequests(`/api/user/${Number(window.player2)}/profile/`);
                            const p1_rating = response_p1.rating;
                            const p2_rating = response_p2.rating;
                            console.log('user1', user1_score, 'user2', user2_score, 'type', block_type);
                            console.log('p1_rating:', p1_rating, 'p2_rating:', p2_rating);
                            if (userData.left_win && userData.right_win) {
                                const response = await ApiRequests('/api/match_stat/', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        'player1': window.player1,
                                        'player2': window.player2,
                                        'player1_score': user1_score,
                                        'player2_score': user2_score,
                                        'winner': winner,
                                        'loser': loser,
                                        'mode': 'r2',
                                        'type': gametype
                                    }),
                                    headers: { 'Content-Type': 'application/json' }
                                })
                                if (response.message != 'success')
                                    console.error('matchstath update error');
                                const response_block = await ApiRequests('/api/tournaments/create/', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        'player1': Number(window.player1),
                                        'player2': Number(window.player2),
                                        'p1Score': user1_score,
                                        'p2Score': user2_score,
                                        'mode': 2,
                                        'gameType': block_type
                                    })
                                })
                                console.log(response_block.status);
                                alert('우승 하셨습니다!')
                                dispatch(tournamentUpdate(2));
                                dispatch(tourCustom(1));
                                navigate('/sidebar');
                                await exit_game();
                                return;
                            }
                            const response = await ApiRequests('/api/match_stat/', {
                                method: 'POST',
                                body: JSON.stringify({
                                    'player1': window.player1,
                                    'player2': window.player2,
                                    'player1_score': user1_score,
                                    'player2_score': user2_score,
                                    'winner': winner,
                                    'loser': loser,
                                    'mode': 'r1',
                                    'type': gametype
                                }),
                                headers: { 'Content-Type': 'application/json' }
                            })
                            if (response.message != 'success')
                                console.error('matchstath update error');
                            const response_block = await ApiRequests('/api/tournaments/create/', {
                                method: 'POST',
                                body: JSON.stringify({
                                    'player1': Number(window.player1),
                                    'player2': Number(window.player2),
                                    'p1Score': user1_score,
                                    'p2Score': user2_score,
                                    'mode': 1,
                                    'gameType': block_type
                                })
                            })
                            console.log(response_block.status);
                            if (myidx < 2) {
                                let right_ids = [];
                                for (let i = 2; i < 4; ++i) {
                                    right_ids.push(userData[`user${i}`]);
                                }
                                dispatch(tournamentUpdate(1, {['left_win']: userData[`user${myidx}_name`], ['left_win_id']: winner}));
                                sendMessage({ type: 'tour_win', user_name: userData[`user${myidx}_name`], users_ids: right_ids, side: 'left', winner: myProfile.userid})
                            }
                            else {
                                let left_ids = [];
                                for (let i = 0; i < 2; ++i) {
                                    left_ids.push(userData[`user${i}`]);
                                }
                                dispatch(tournamentUpdate(1, {['right_win']: userData[`user${myidx}_name`], ['right_win_id']: winner}));
                                sendMessage({ type: 'tour_win', user_name: userData[`user${myidx}_name`], users_ids: left_ids, side: 'right', winner: myProfile.userid})
                            }
                        }
                    } else {
                        gametype = window.isMatch ? 'match' : 'custom'
                        if (gameResult === 'win') {
                            const response = await ApiRequests('/api/match_stat/', {
                                method: 'POST',
                                body: JSON.stringify({
                                    'player1': window.player1,
                                    'player2': window.player2,
                                    'player1_score': user1_score,
                                    'player2_score': user2_score,
                                    'winner': winner,
                                    'loser': loser,
                                    'mode': 'casual',
                                    'type': gametype
                                }),
                                headers: { 'Content-Type': 'application/json' }
                            })
                            if (response.message != 'success') {
                                console.error('matchstath update error');
                            }
                        }
                        await exit_game();
                    }
                    navigate('/sidebar');
                } catch (error) {
                    console.error('Error updating status:', error);
                }
            }
        };
        updateStatus();
    }, [gameResult, navigate])

    return (
        <div class="game-container">
            <h1 id="room-name">{roomId}</h1>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
            <canvas id="pong" width="800" height="600"></canvas>
        </div>
    );
}