import React from 'react';
import { getTimeDifferenceMinutes } from './utils';

const ProfileInfo = ({ meProfile, userData, handleFriendRequest, handleFriendRemove, handleFriendBlocked, handleUnBlock, related, blocked }) => {
    const renderActions = () => {
        if (meProfile) return null;

        return (
            <>
                {/* 친구 추가/제거 버튼 */}
                {!related ? (
                    <button className="add-btn" onClick={handleFriendRequest}>
                        <img src="/add-friend.png" alt="friend add icon" className="icon"/>
                    </button>
                ) : (
                    <button className="delete-btn" onClick={handleFriendRemove}>
                        <img src="/delete-friend.png" alt="friend delete icon" className="icon"/>
                    </button>
                )}
                {/* 차단/차단 해제 버튼 */}
                {blocked ? (
                    <button className="unblock-btn" onClick={handleUnBlock}>
                        <img src="/unblock.png" alt="friend unblock icon" className="icon"/>
                    </button>
                ) : (
                    <button className="block-btn" onClick={handleFriendBlocked}>
                        <img src="/block-friend.png" alt="friend block icon" className="icon"/>
                    </button>
                )}
            </>
        );
    };

    return (
        <div className="profile-image-container">
            <div className="profile-image-box">
                <img className="profile-image" src={userData.image} alt="profile image" />
                <div className="profile-image-userid">
                    {userData.name}
                    {renderActions()}
                </div>
                {userData.is_online ? (
                    <>
                        <p></p>
                        <div className="profile-image-login">🟢 online</div>
                    </>
                ) : (
                    <>
                        <div className="profile-image-login">Last login</div>
                        <div className="profile-image-login">{getTimeDifferenceMinutes(userData.last_logins)}</div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfileInfo;