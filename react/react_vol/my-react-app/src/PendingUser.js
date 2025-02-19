import React, { useEffect, useState } from "react";
import { useWebSocket } from "./WebSocketContext";
import { useSelector } from "react-redux";
import ApiRequests from "./ApiRequests";
import "./PendingUser.css"


export default function PendingUser({ requests, requestsFrom, handleFriendRemove }) {
    const [pendingRequests, setPendingRequests] = useState(requests);
    const [pendingRequestsFrom, setPendingRequestsFrom] = useState(requestsFrom);
    const { sendMessage } = useWebSocket();
    const { userData } = useSelector(state => state.userReducer);

    useEffect(() => {
        setPendingRequests(requests);
        setPendingRequestsFrom(requestsFrom);
    }, [requests, requestsFrom]);
    const updateFriendRequest = (requestId, status) => {
        sendMessage({ type: 'update_friend_request', request_id: requestId, new_status: status });
        sendMessage({ type: 'selfRefresh', users: [{ id : requests[0].from_user }]})
    };

    const handleRejectRequest = async () => {
        try {
            await ApiRequests(`/api/related/remove/?myuid=${userData.userid}&otheruid=${requests[0].from_user}`, {
                method: 'DELETE',
            });
            sendMessage({ type: "selfRefresh", users: [{ id : userData.userid}, { id : requests[0].from_user}]});
        } catch (error) {
            console.error('Failed to fetch remove requests:', error);
        }
    }

    return (
        <div id="sidebar-online-user">
            <div id="sidebar-online-header">
                <h5 id="sidebar-online-text">Pending Users({pendingRequests?.length || 0})</h5>
                    <div>
                        {pendingRequests?.map(request => (
                            <div key={request.id} className="d-flex align-items-center justify-content-between p-2">
                                <span>{request.from_username}</span>
                                <div>
                                    <button onClick={() => updateFriendRequest(request.id, 'accepted')} class='accept-button'>수락</button>
                                    <button onClick={() => handleRejectRequest()} class='reject-button'>거절</button>
                                </div>
                            </div>
                        ))}
                        {pendingRequestsFrom?.map(request => (
                            <div key={request.id} className="d-flex align-items-center justify-content-between p-2">
                                <span>{request.to_username}</span>
                                <div> 수락 대기중 입니다. </div>
                            </div>
                        ))}
                    </div>
            </div>
        </div>
    );
}