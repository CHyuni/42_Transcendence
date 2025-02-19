import React, { useEffect } from "react";
import SideDropBox from "./SideDropbox";
import { useDispatch, useSelector } from 'react-redux';
import { profileFriend } from "./redux/actions/friendActions";
import { useWebSocket } from "./WebSocketContext";
import ApiRequests from "./ApiRequests";
import { Dropdown } from 'bootstrap';

export default function FriendCard({ name, id, rating, status, isBlock, myProfile }) {
  const { profileIdx } = useSelector(state => state.profileReducer);
  const { sendMessage } = useWebSocket();
  const dispatch = useDispatch();
  const handleProfile = async () => {
    const response = await ApiRequests(`/api/user/${id}/profile`)
    dispatch(profileFriend({ name: response.username, id: id, rating: rating, status: response.status,
      top_rating: response.top_rating, casual_win: response.casual_win, casual_lose: response.casual_lose,
      tournament_win: response.tournament_win, tournament_lose: response.tournament_lose,
      image: response.profile_image_base64
      ? `data:image/jpeg;base64,${response.profile_image_base64}` 
      : response.profile_image, winning: response.winning, last_logins: response.last_logins, is_online: response.is_online
    }));
  }
  const handleunblock = async () => {
    try {
      const response = await ApiRequests(`/api/blocked/unblock/?myuid=${myProfile.userid}&otheruid=${id}`, {
          method: 'DELETE',
      });
      sendMessage({ type: "selfRefresh", users: [{ id : myProfile.userid}, { id : id}]});
      alert('차단 해제 완료.');
    } catch (error) {
        console.error('Failed to fetch unblock requests:', error);
    }
  }
  // let dropdowns = ["Play", "Chat", "Block", "Delete"];
  let dropdowns = ["Play", "Chat", "Block", "Delete"];
  if (status !== "available") {
    dropdowns = ["Chat", "Block", "Delete"];
  }
  // if (isBlock)
  // {
  //   dropdowns = ["Play", "UnBlock", "Delete"];
  //   if (status !== "available")
  //     dropdowns = ["UnBlock", "Delete"];
  // }
  // else if (status !== "available")
  //   dropdowns = ["Chat", "Block", "Delete"];
  // useEffect(() => {
  //   const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
  //   const dropdowns = [...dropdownElementList].map(el => new Dropdown(el));
    
  //   return () => {
  //     dropdowns.forEach(dropdown => dropdown.dispose());
  //   };
  // }, []);
  return (
    <div>
    <li class="list-group-item dropdown d-flex justify-content-between align-items-center" 
        id="list-group"
        onClick={isBlock ? handleunblock : handleProfile}
        data-bs-toggle="dropdown"
        aria-expanded="false"
        type="button"
        >
        <div class="user-name">{name}</div>
        <div class="user-rating">{rating}</div>
        <div class={`user-status ${status}`}></div>
    </li>
      {/* <SideDropBox idx={idx} dropdowns={dropdowns}/> */}
    </div>
  );

  
}
