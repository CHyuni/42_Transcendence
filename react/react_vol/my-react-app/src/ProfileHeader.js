import React from 'react';

const ProfileHeader = ({ meProfile, handleClose, related, blocked, toggleDropdown }) => {
    return (
        <div className="profile-image-header">
            {meProfile ? (
                <div className="profile-header">
                    <img className="profile-icon" src="/profile.png" alt="profile icon" />
                </div>
            ) : (
                <div className="profile-header">
                    <img 
                        className="profile-icon" 
                        src="/profile.png" 
                        alt="profile icon"
                        onClick={toggleDropdown}
                    />
                    <div class="dropdown-content">
                                {related ? (
                                    <>
                                        <li class="dropdown-li" onClick={handleChat}>Chat</li>
                                    </>
                                ) : (
                                    <>
                                        <li class="dropdown-li" onClick={handleFriendRequest}>Add</li>
                                    </>
                                )}
                                {blocked ? (
                                    <>
                                        <li class="dropdown-li" onClick={handleUnBlock}>UnBlock</li>
                                    </>
                                ) : (
                                    <>
                                        <li class="dropdown-li" onClick={handleFriendBlocked}>Block</li>
                                    </>
                                )}
                            </div>
                </div>
            )}
            <button 
                type="button" 
                className="btn-close"
                id="profile-close"
                aria-label="Close"
                onClick={handleClose}
            ></button>
        </div>
    );
};

export default ProfileHeader;