// WebSocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import ApiRequests from './ApiRequests';
import { useNotification } from './NotificationContext';
import { tournamentUpdate } from './redux/actions/gameActions';
import { tourCustom } from './redux/actions/gameActions';
import { createRoomId } from './utils';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, onRefresh, selfRefresh, onGameStart, myProfile }) => {
  const [socket, setSocket] = useState(null);
  const getStartRef = useRef(false);
  const customUser = useSelector(state => state.tourCustomReducer.userData);
  const custom = useRef(customUser);
  const { showToastMessage, showConfirmModal } = useNotification();
  const userData = useSelector(state=> state.tournaReducer.userData);
  const latestUserData = useRef(userData);
  const [userid, setUserid] = useState(0);
  const [username, setUsername] = useState(null);
  const dispatch = useDispatch();
  const [timeoutId, setTimeoutId] = useState(null);
  const maxTries = 30;
  const [currentTries, setCurrentTries] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const ws = useRef(null);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  useEffect(() => {
    if (myProfile) {
      setUserid(myProfile.userid);
      setUsername(myProfile.username);
    }
  }, [myProfile]);

  useEffect(() => {
    custom.current = customUser;
  }, [customUser]);

  useEffect(() => {
    const gameStart = async () => {
      const roomname = createRoomId(userData.right_win, userData.left_win);
      const gamemessage = { type: 'game_response', from_user_id: userData.right_win_id, response: 'accept',
        from_user_name: userData.right_win, to_user_name: userData.left_win, to_user_id: userData.left_win_id, match: 'y', room_name: roomname};
      ws.current.send(JSON.stringify(gamemessage));
      const gamemessage2 = { type: 'game_response', from_user_id: userData.left_win_id, response: 'accept',
        from_user_name: userData.left_win, to_user_name: userData.right_win, to_user_id: userData.right_win_id, match: 'y', room_name: roomname};
      ws.current.send(JSON.stringify(gamemessage2));
    }
    if (userData.left_win_id && userData.right_win_id && userData.left_win_id === userid)
        gameStart();
  }, [userData.left_win_id, userData.right_win_id])

  useEffect(() => {
    latestUserData.current = userData;
    const timecheck = async (currentTry) => {
      if (getStartRef.current) {
        clearTimeout(timeoutId);
        setTimeoutId(null)
        setCurrentTries(0);
        setIsTimerRunning(false);
        getStartRef.current = false;
        return;
      }
      if (currentTry < maxTries) {
        setCurrentTries((prevCurrentTries) => {            
          console.log('timecheck:', prevCurrentTries)
          const newCurrentTries = prevCurrentTries + 1;
          const newTimeoutId = setTimeout(() => timecheck(newCurrentTries), 5000);
          setTimeoutId(newTimeoutId);
          return newCurrentTries;
        });
      }
       else {
        console.log('max tries reached. stopping')
        clearTimeout(timeoutId);
        setTimeoutId(null)
        setCurrentTries(0);
        setIsTimerRunning(false);
        const response_status = await ApiRequests('/api/status/me/state-update/',  {
          method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }})
        if (response_status === 'Not Found status')
          console.error('state-update Failed')
        sendMessage({ type: 'refresh' });
        alert('상대방의 연결이 종료됨');
        dispatch(tournamentUpdate(2));
        dispatch(tourCustom(1));
        window.location.href = '/';
      }
    }
    if (!isTimerRunning && (userData.right_win_id === userid || userData.left_win_id === userid) && !getStartRef.current) {
      setCurrentTries(0);
      const newTimeoutId = setTimeout(() => timecheck(currentTries), 5000);
      setTimeoutId(newTimeoutId);
      setIsTimerRunning(true);
    }

    return () => {
      console.log('Component unmounted, clearing timeout');
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      getStartRef.current = false;
    };
 }, [userData]);
  
  useEffect(() => {
    if (!username || !userid) return

    console.log('Websocket username:', username, 'userid:', userid);
    ws.current = new WebSocket(`wss://${window.location.host}/ws/channel/?username=${username}&userid=${userid}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws.current);
    };
    
    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'refresh':
          onRefresh();
          break;
        case 'selfRefresh':
          selfRefresh();
          break;
        case 'new_friend_request':
          showToastMessage(`${data.from_user_name}님으로부터 ${data.to_user_name}님에게 친구 요청이 왔습니다`, 3000, 'notice');
          selfRefresh();
          break;
        case 'send_new_friend_request':
          if (data.status === 'friend_already_exists') {
            showToastMessage(`${data.to_user_name}님에게 이미 친구 요청을 보냈습니다.`, 3000, 'notice');
          }
          else if (data.status === 'friend_request_success') {
            showToastMessage(`${data.to_user_name}님에게 친구 요청을 보냈습니다.`, 3000, 'notice');
          }
          selfRefresh();
          break
        case 'game_request':
          if (data.status === 'me') {
            showToastMessage(`${data.to_user_name}님에게 게임 요청을 보냈습니다.`, 3000, 'notice');
          } else {
            const response_status = await ApiRequests('/api/status/me/state-update/',  {
                method: 'PATCH',
                body: JSON.stringify({
                    status: 'in-queue',
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response_status === 'Not Found status')
              alert('오류 발생');
            ws.current.send(JSON.stringify({ type: 'refresh'}))
            if (data.mode === 'casual') {
              showConfirmModal(
                `${data.from_user_name}님으로 부터\n 게임 요청을 받았습니다.`,
                async () => {
                  const roomname = createRoomId(data.from_user_name, data.to_user_name);
                  const gamemessage = { type: 'game_response', from_user_id: data.from_user_id, response: 'accept', from_user_name: data.from_user_name,
                  to_user_name: data.to_user_name, to_user_id: data.to_user_id, room_name: roomname};
                  ws.current.send(JSON.stringify(gamemessage));
                  const gamemessage2 = { type: 'game_response', from_user_id: data.to_user_id, response: 'accept', from_user_name: data.to_user_name,
                    to_user_name: data.from_user_name, to_user_id: data.from_user_id, room_name: roomname};
                  ws.current.send(JSON.stringify(gamemessage2));
                },
                async () => {
                  const gamemessage = { type: 'game_response', from_user_id: data.from_user_id, response: 'reject', from_user_name: data.from_user_name,
                  to_user_name: data.to_user_name, to_user_id: data.to_user_id };
                  ws.current.send(JSON.stringify(gamemessage));
                  const gamemessage2 = { type: 'game_response', from_user_id: data.to_user_id, response: 'reject', from_user_name: data.to_user_name,
                    to_user_name: data.from_user_name, to_user_id: data.from_user_id };
                  ws.current.send(JSON.stringify(gamemessage2));
                }
              );
            } else {
              showConfirmModal(
                `${data.from_user_name}님으로 부터\n 게임 요청을 받았습니다.`,
                async () => {
                  let nickname = prompt('사용 할 닉네임을 입력해주세요.');
                  try {   
    
                    const response = await ApiRequests(`/api/validate/?nickname=${encodeURIComponent(nickname)}`, {
                        method: 'GET',
                    });
                } catch (error) {
                    alert('입력 형식에 오류가 있습니다.');
                    await ApiRequests('/api/status/me/state-update/',  {
                      method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }
                  })
                    nickname = null
                }
                  if (nickname === null) {
                    const tourcustommessage = { type: 'tour_custom', from_user_id: data.from_user_id, from_user_name: data.from_user_name,
                      to_user_name: data.to_user_name, to_user_id: data.to_user_id, response: 'reject' };
                    ws.current.send(JSON.stringify(tourcustommessage));
                    const response_status = await ApiRequests('/api/status/me/state-update/', {
                      method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }});
                    if (response_status === 'Not Found status')
                      console.error('state-update Failed');
                    ws.current.send(JSON.stringify({ type: 'refresh' }))
                    return;
                  }
                  if (nickname === "") {
                    nickname = data.to_user_name;
                  }
                  const tourcustommessage = { type: 'tour_custom', from_user_id: data.from_user_id, from_user_name: data.from_user_name,
                    to_user_name: data.to_user_name, to_user_id: data.to_user_id, response: 'accept', nickname: nickname };
                  ws.current.send(JSON.stringify(tourcustommessage));
                },
                async () => {
                  const tourcustommessage = { type: 'tour_custom', from_user_id: data.from_user_id, from_user_name: data.from_user_name,
                    to_user_name: data.to_user_name, to_user_id: data.to_user_id, response: 'reject' };
                  ws.current.send(JSON.stringify(tourcustommessage));
                  const response_status = await ApiRequests('/api/status/me/state-update/', {
                    method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }});
                  if (response_status === 'Not Found status')
                    console.error('state-update Failed');
                  ws.current.send(JSON.stringify({ type: 'refresh' }))
                }
              );
            }
          }
          break;
        case 'game_response':
          if (data.result === 'reject') {
            const response_status = await ApiRequests('/api/status/me/state-update/',  {
              method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }})
            if (response_status === 'Not Found status')
              console.error('state-update Failed')
            ws.current.send(JSON.stringify({ type: 'refresh' }))
          } else if (data.result === 'accept') {
            const response_status = await ApiRequests('/api/status/me/state-update/',  {
              method: 'PATCH', body: JSON.stringify({ status: 'playing' }), headers: { 'Content-Type': 'application/json' }})
            if (response_status === 'Not Found status')
              console.error('state-update Failed')
            ws.current.send(JSON.stringify({ type: 'refresh' }))
            getStartRef.current = true;
            if (data.matching) {
              window.isMatch = true;
              await showToastMessage('매칭 완료', 2000, 'game')
            }
            window.player1 = Number(data.player1_id);
            window.player2 = Number(data.player2_id);
            let roomname = data.room_name
            await showToastMessage('게임을 시작 합니다.', 5000, 'game');
            onGameStart(roomname);
          } else {
            console.error('state-update Failed')
          }
          break;
        case 'tourna_match':
          for (let i = 0; i < data.users_ids.length; ++i) {
            dispatch(tournamentUpdate({start: 2}));
            if (data.custom) {
              dispatch(tournamentUpdate(1, {[`user${i}`]: data.users_ids[i], [`user${i}_name`] : data.users_name[i], ['myidx']: i}));
            }
            else {
              dispatch(tournamentUpdate(1, {[`user${i}`]: data.users_ids[i], [`user${i}_name`] : data.users_name[i], ['myidx']: i, ['match']: true}));
            }
          }
          if (Number(data.myuid) === data.users_ids[0] || Number(data.myuid) === data.users_ids[2]) {
            let i;
            if (Number(data.myuid) === data.users_ids[0]) i = 0;
            else i = 2;
            const roomname = createRoomId(data.users_name[i + 1], data.users_name[i]);
            const gamemessage = { type: 'game_response', from_user_id: data.users_ids[i + 1], response: 'accept', from_user_name: data.users_name[i + 1],
              to_user_name: data.users_name[i], to_user_id: data.users_ids[i], room_name: roomname};
            ws.current.send(JSON.stringify(gamemessage));
            const gamemessage2 = { type: 'game_response', from_user_id: data.users_ids[i], response: 'accept', from_user_name: data.users_name[i],
              to_user_name: data.users_name[i + 1], to_user_id: data.users_ids[i + 1], room_name: roomname};
            ws.current.send(JSON.stringify(gamemessage2));
          }
          break;
        case 'tour_side_winner':
          let i;
          if (data.side === 'left') {
            dispatch(tournamentUpdate(0, {['left_win']: data.user_name, ['left_win_id']: data.winner}));
            getStartRef.current = false;
          } else {
            dispatch(tournamentUpdate(0, {['right_win']: data.user_name, ['right_win_id']: data.winner}));
            getStartRef.current = false;
          }
          break;
        case 'tourna_winner':
          alert(`${data.user_name}님 승리 하였습니다!`);
          break;
        case 'tour_custom_reject':
          showToastMessage(`${data.to_user_name}님 참여 거절`, 2000, 'notice');
          break;
        case 'tour_custom':
          showToastMessage(`${data.to_user_name}님 참여`, 2000, 'notice');
          dispatch(tourCustom(0, [{ user_id: data.to_user_id, tournament_name: data.nickname }]));
          await sleep(100)
          const users_ids = custom.current.map(user => user.user_id);
          const usermessage = { type: 'custom_user_update', userData: custom.current, users_ids: users_ids};
          ws.current.send(JSON.stringify(usermessage));
          if (users_ids.length === 4) {
            const gamemessage = { type: 'tourna_match', matched_users: custom.current, custom: true }
            ws.current.send(JSON.stringify(gamemessage));
          }
          break;
        case 'custom_user_update':
          dispatch(tourCustom(1));
          dispatch(tourCustom(0, data.userData))
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    };
    
    ws.current.onclose = () => {
      console.log('WebSocket closed');
    };
    
    return () => {
      console.log('Cleaning up websocket connection');
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      setSocket(null);
    };
  }, [username, userid]);

  const sendMessage = (message) => {
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const closeSocket = () => {
    if (socket) {
      socket.close();
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, sendMessage, closeSocket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};