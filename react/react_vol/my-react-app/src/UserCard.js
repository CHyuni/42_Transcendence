import React from "react";
import { useDispatch } from 'react-redux';
import { profileFriend } from "./redux/actions/friendActions";
// import SideDropBox from "./SideDropbox";

export default function UserCard({ name, id, rating, status, top_rating, casual_win, casual_lose, tournament_win, tournament_lose, image, winning, last_logins, is_online}) {
  const dispatch = useDispatch();
  const handleProfile = () => {
    dispatch(profileFriend({ name, id, rating, status, top_rating, casual_win, casual_lose, tournament_win, tournament_lose, image, winning, last_logins, is_online }));
  }

  return (
    <div>
    <li class="list-group-item d-flex justify-content-between align-items-center"
      id="list-group"
      onClick={handleProfile}
    >
        <div class="user-name">{name}</div>
        <div class="user-rating">{rating}</div>
        <div class={`user-status ${status}`}></div>
    </li>
    {/* <SideDropBox idx={idx} dropdowns={dropdowns}/> */}
    </div>
  );
}