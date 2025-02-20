import React, { useEffect, useState, useCallback } from "react";
import { WebSocketProvider  } from "./WebSocketContext";
import { BrowserRouter as Router, Routes, Route, Link, Navigate} from "react-router-dom";
import './main.css';
import AiGame from "./AiGame"
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "bootstrap-icons/font/bootstrap-icons.css";
import SideBar from "./SideBar"
import Game from "./Game";
import TwoFactorAuth from './TwoFactorAuth';
import ApiRequests from './ApiRequests'
import { NotificationProvider } from "./NotificationContext";

function Main() { 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  // 이하 3 함수 테스트 로그인을 위한 것
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setInputText('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  // 현재 42 Oauth로만 로그인 가능, 테스팅을 위한 데이터베이스의 유저를 이용 해 로그인
  const handleTestLoginSubmit = async () => {
    // API 호출 로직
    try {
        const response = await fetch('/api/testlogin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ temp: inputText }),
        });

        if (response.ok) {
            const data = await response.json();
            if (data.redirect_url) {
                window.location.href = data.redirect_url;
            }
        } else {
            console.error('API 호출 실패:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('API 호출 중 오류:', error);
    }
    handleCloseModal();
  };

  function login() {
    const clientId = process.env.REACT_APP_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.REACT_APP_REDIRECT_URL);
    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    window.location.href = authUrl;
  }

  return (
    <div>
        <img src="/TableTennisMain.png" className="main" alt="logo" />
        <div className="main-header">
          <img id="main-logo" src="/main-logo.png"/>
          <p id="header-font">Table Tennis</p>
        </div>
        <div className="main-font-container">
            Welcome <br></br> 42 transcendence
        </div>
        <div className="main-auth-container">
          <button className="button" onClick={handleOpenModal}><img id="google-icon" src="/google-icon.png"/>continue with google</button>
          <button className="button" id="button-42" onClick={login}><img id="four-icon" src="/42-icon.png" />continue with intra</button>
        </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>id 입력</h3>
            <input type="text" value={inputText} onChange={handleInputChange} />
            <div className="modal-buttons">
              <button className="button" onClick={handleTestLoginSubmit}>제출</button>
              <button className="button" onClick={handleCloseModal}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.csrfToken = null;

function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);

  const checkLoginStatus = useCallback(async () => {
    try {
      const data = await ApiRequests('/api/user/me/profile', {login_check: true});
      setIsLoggedIn(true);
      setProfile(data);
      console.log('Logged in:', data.username);
    } catch (error) {
      if (!error.message.includes("401")) {
        console.error('Error checking login status:', error);
      }
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  return { isLoggedIn, profile };
}

function App() {
  const { isLoggedIn, profile } = useAuth();
  const [myProfile, setMyProfile] = useState(null);
  const [gameStartCount, setGameStartCount] = useState(0);
  const [gameRoomId, setGameRoomId] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [selfRefreshCount, setSelfRefresh] = useState(0);

  // 전적변화, 유저상태 등을 접속중인 전 인원에게 즉각 반응 할수 있는 전유저적인 새로고침
  const handleRefresh = useCallback(() => {
    setRefreshCount(prevCount => prevCount + 1);
  }, []);

  // 친구추가, 친구삭제, 차단 및 해제 등 본인 혹은 상대방만 변화가 일어나야하는 새로고침
  const setSelfRefreshCount = useCallback(() => {
    setSelfRefresh(prevcnt => prevcnt + 1);
  }, []);

  useEffect(() => {
    // 새로고침 시의 URL 확인
    const currentPath = window.location.pathname;

    if (currentPath.endsWith('/') && currentPath !== '/') {
      // trailing slash가 있고 root path가 아닌 경우
      const newPath = currentPath.slice(0, -1);
      window.location.replace(newPath);
      return;
    }
  }, []);

  useEffect(() => {
    if (!myProfile) setMyProfile(profile);
    if (isLoggedIn) {
      const fetchProfile = async () => {
        const response = await ApiRequests('/api/user/me/profile');
        setMyProfile(response);
      }
  
      fetchProfile();
    }
  }, [refreshCount, selfRefreshCount, profile]);
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <WebSocketProvider onRefresh={handleRefresh} selfRefresh={setSelfRefreshCount}
          onGameStart={(roomId) => { setGameRoomId(roomId); setGameStartCount(prev => prev + 1)}} myProfile={myProfile}>
          {isLoggedIn ? (
            <Routes>
              <Route path="/game/:roomId" element={<Game myProfile={myProfile}/>} />
              <Route path="/verify-2fa" element={<TwoFactorAuth />} />
              <Route path="/sidebar" element={<SideBar refresh={refreshCount} selfRefresh={selfRefreshCount} selfRefreshbtn={setSelfRefreshCount}
                gameStartCount={gameStartCount} gameRoomId={gameRoomId} setGameRoomId={setGameRoomId} setGameStartCount={setGameStartCount} myProfile={myProfile}/>} />
              <Route path="/" element={<Navigate to="/sidebar" />} />
              <Route path='/ai-mode' element={<AiGame />} />
              <Route path="*" element={<Navigate to="/sidebar" />} />
            </Routes>
          ) : (
            <>
              <Routes>
                <Route path="/" element={<Main />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </>
          )}
        </WebSocketProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
