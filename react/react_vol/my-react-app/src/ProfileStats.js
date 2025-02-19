import React from 'react';

const ProfileStats = ({ userData }) => {
    return (
        <div className="profile-content">
            <div className="profile-content-box-top">
                <StatBox label="Current" value={userData.rating} />
                <StatBox label="Highest" value={userData.top_rating} />
            </div>
            <div className="profile-content-box-top">
                <StatBox 
                    label="Casual" 
                    value={`${userData.casual_win}W ${userData.casual_lose}L (${getWinRate(userData.casual_win, userData.casual_lose)})`} 
                />
                <StatBox 
                    label="Tournament" 
                    value={`${userData.tournament_win}W ${userData.tournament_lose}L (${getWinRate(userData.tournament_win, userData.tournament_lose)})`} 
                />
            </div>
            <div className="profile-content-box-top">
                <StatBox 
                    label="Highest Winning Streak" 
                    value={userData.winning} 
                />
            </div>
        </div>
    );
};

const StatBox = ({ label, value }) => (
    <div className="profile-content-box">
        <div className="profile-record-top">{label}</div>
        <div className="profile-record">{value}</div>
    </div>
);

const getWinRate = (wins, losses) => {
    const total = wins + losses;
    return total === 0 ? "0%" : `${Math.round((wins / total) * 100)}%`;
};

export default ProfileStats;