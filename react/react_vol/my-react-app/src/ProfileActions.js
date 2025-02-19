import React from 'react';

const ProfileActions = ({ meProfile, handleGameStart }) => {
    if (meProfile) return null;

    return (
        <div className="profile-bottom">
            <div className="btn-container">
                <button onClick={handleGameStart}>Play</button>
            </div>
        </div>
    );
};

export default ProfileActions;