// useFriendStatus.js
import { useState, useEffect } from 'react';
import ApiRequests from './ApiRequests';

export function useFriendStatus(myProfile, userData) {
    const [related, setRelated] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            setLoading(true);
            try {
                const response_related = await ApiRequests(`/api/related/friend/?myuid=${myProfile.userid}&otheruid=${userData.id}`);
                setRelated(response_related.is_related);

                const response_blocked = await ApiRequests(`/api/blocked/create/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        myuid: myProfile.userid,
                        otheruid: userData.id,
                        mode: 'check'
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });
                setBlocked(response_blocked.blocked);
            } catch (error) {
                console.error('Failed to fetch friend status:', error);
            }
            setLoading(false);
        };

        if (myProfile && userData && myProfile.userid !== userData.id) {
            fetchStatus();
        }
    }, [myProfile, userData]);

    return { related, blocked, loading };
}