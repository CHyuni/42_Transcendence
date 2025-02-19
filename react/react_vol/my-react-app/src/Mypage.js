import React, { useEffect, useState } from "react";
import "./mypage.css"
import WinLossBar from "./WinLossBar";
import ApiRequests from './ApiRequests'

export default function Mypage({ myProfile }) {
    const [selectedValue, setSelectedValue] = useState(myProfile.totp_enabled ? 'option1' : 'option2');
    const [about, setAbout] = useState(myProfile.about_me);
    const [profileImage, setProfileImage] = useState(
        myProfile.profile_image_base64
          ? `data:image/jpeg;base64,${myProfile.profile_image_base64}` 
          : myProfile.profile_image
      );
    const [qrImage, setqrImage] = useState('');
    const [setupID, setSetupID] = useState('');
    const wins = myProfile.casual_win + myProfile.tournament_win;
    const losses = myProfile.casual_lose + myProfile.tournament_lose;

    useEffect(() => {
        const fetchQRImage = async () => {
            try {
                const data = await ApiRequests('/api/oauth/qrcode');
                setqrImage(decodeURIComponent(data.qr_code_url));
                setSetupID(data.setup_id);
            } catch (error) {
                console.error('Error fetching QR code:', error);
            }
        };
        fetchQRImage();
    }, []);

    const handleChange = (e) => {
        setSelectedValue(e.target.value);
        const qr = document.querySelector(".fa-row");
        if (e.target.value === 'option1')
            qr.style.display = 'flex';
        else
            qr.style.display = 'flex';
    };
    const handleSave = async () => {
        try {
            const response = await ApiRequests('/api/totp/save-2fa/', {
                method: 'POST',
                body: JSON.stringify({
                    setup_id: setupID
                }),
            });
            alert('성공적으로 저장되었습니다.');
        } catch (err) {
            console.error('Error details:', err);
            alert(err.message || '저장에 실패했습니다.');
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('profile_image_file', file);
    
        try {
            const response = await ApiRequests('/api/user/update-profile-image/', {
                method: 'PATCH',
                body: formData
            });
            setProfileImage(`data:image/jpeg;base64,${response.profile_image_base64}`);
        } catch (err) {
            console.error('Error uploading image:', err);
        }
    };

    const submitApi = async () => {
        try {
            const response = await ApiRequests('/api/user/update-profile/', {
                method: 'PATCH',
                body: JSON.stringify({
                    about_me: about,
                    totp_enabled: selectedValue === 'option1'
                })
            });
            alert('성공적으로 저장되었습니다.');
        } catch (err) {
            alert('입력 형식에 오류가 있습니다.');
        }       
    };
    return (
        <div class="mypage-container">
            <div class="mypage-item">
                <div class="mypage-header">My Page</div>
                <div class="mypage-body">
                    <div className="mypage-image-container">
                        <img className="mypage-image" src={profileImage} alt="my image"/>
                        <input 
                            type="file"
                            id="profile-image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                        <label 
                            htmlFor="profile-image-upload" 
                            className="image-upload-button"
                        >
                            이미지 변경
                        </label>
                    </div>
                    <div class="mypage-info-container">
                        <div class="mypage-row">
                            <p class="mypage-info-title">Intra-id </p>
                            <input class="mypage-input" value={myProfile.username} disabled/>
                        </div>
                        <div class="mypage-row">
                            <p class="mypage-info-title">2FA Enabled</p>
                            <div class="form-check">
                                <input 
                                    class="form-check-input" 
                                    type="radio" 
                                    name="flexRadioDefault" 
                                    id="flexRadioDefault1"
                                    value="option1"
                                    checked={selectedValue === 'option1'}
                                    onChange={handleChange}
                                />
                                <label class="form-check-label" id="flexRadio" for="flexRadioDefault1">
                                    Enabled
                                </label>
                            </div>
                            <div class="form-check">
                                <input 
                                    class="form-check-input" 
                                    type="radio" 
                                    name="flexRadioDefault" 
                                    id="flexRadioDefault2" 
                                    value="option2"
                                    checked={selectedValue === 'option2'}
                                    onChange={handleChange}
                                />
                                <label class="form-check-label" id="flexRadio" for="flexRadioDefault2">
                                    Disabled
                                </label>
                            </div>
                        </div>
                        <div class="mypage-row">
                            <p class="mypage-info-title">About Me </p>
                        </div>
                        <div class="fa-row">
                            <textarea 
                                class="about-me-input" 
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}/>
                        </div>
                        <div class="mypage-row">
                            <button class="mypage-btn"onClick={submitApi}>Save</button>
                        </div>
                        <div className="fa-row">
                            <div className="fa-qr-code">
                                <img src={qrImage} className="qr-code" alt="qr-code" />
                                <button className="save-button" onClick={handleSave} >qr 코드 저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mypage-item">
                <div class="mypage-header">My Stats</div>
                <div class="mystat-body">
                    <div class="mypage-col" >
                        <div class="col-header">Rating</div>
                        <div class="col-body">
                            <img 
                                class="chart-icon"
                                src="chart1.png" 
                                alt="chart icon"/>
                            <div class="col-sub">{myProfile.rating}</div>
                        </div>
                    </div>
                    <div class="mypage-row" id="highest-rating">
                        <div class="mypage-col">
                            <div class="col-header" id="high-rating-header">Casual</div>
                            <div class="col-body">
                                <div class="col-sub">
                                    <span class="win-word">{myProfile.casual_win}W</span>
                                    <span class="lose-word">{myProfile.casual_lose}L</span>
                                </div>
                            </div>
                        </div>
                        <div class="mypage-col">
                            <div class="col-header" id="high-rating-header">Tournament</div>
                            <div class="col-body">
                                <div class="col-sub">
                                    <span class="win-word">{myProfile.tournament_win}W</span>
                                    <span class="lose-word">{myProfile.tournament_lose}L</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mypage-col" >
                        <div class="col-header"> {wins + losses}Games</div>
                        <WinLossBar 
                        wins={wins || 0} 
                        losses={losses || 0} 
                    />
                    </div>
                    <div class="mypage-col" id="highest-rating">
                        <div class="col-header" id="high-rating-header">Highest Rating</div>
                        <div class="col-body">
                            <img 
                                class="chart-icon"
                                src="bar-graph.png" 
                                alt="bar icon"/>
                            <div class="col-sub">{myProfile.top_rating}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}