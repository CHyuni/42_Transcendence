import React, { useEffect, useState } from "react";
import ApiRequests from "./ApiRequests";
import "./AiGame.css"

export default function Game() {
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const data = await ApiRequests('/api/user/me/profile/');
                setUserProfile(data);
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            }
        };
        
        fetchUserProfile();
    }, []);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "/game/ai_pong.js"; // public 경로를 기준으로 설정
    
        // 스크립트를 DOM에 추가
        document.body.appendChild(script);
    
        // 클린업 함수: 스크립트 제거
        return () => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div class="aigame-outer-container">
            <div class="aiplayer">
                <div class="aiplayer-container">
                    {userProfile && <div class="aiplayer-id">{userProfile.username}</div>}
                    <div class="aiimage-container">
                        {userProfile && <img class="aiplayer-image" src={userProfile.profile_image} alt="ksuh" />}
                    </div>
                </div>
            </div>
            <div class="aiplayer-empty"></div>
            <div class="aigame-container">
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
                <canvas id="ai_pong" width="1080" height="820"></canvas>
            </div>
            <div class="aiplayer">
                <div class="aiplayer-container">
                    <div class="aiplayer-id">Ai</div>
                    <div class="aiimage-container">
                        <img class="aiplayer-image" src="ksuh.jpg" alt="ksuh" />
                    </div>
                </div>
            </div>
        </div>
    );
}