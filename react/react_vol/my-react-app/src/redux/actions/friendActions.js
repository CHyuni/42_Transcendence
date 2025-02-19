export const TOGGLE_FRIEND = "FRIEND/CHANGE";

export const toggleFriend = (id) => ({ 
    type: TOGGLE_FRIEND,
    payload: id,
});

export const PROFILE_FRIEND = "PROFILE/CHANGE";

export const profileFriend = (userData) => ({
    type: PROFILE_FRIEND,
    payload: userData,
});
