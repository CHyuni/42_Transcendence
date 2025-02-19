import React, { useEffect, useState } from "react";

export default function TeamCard({ jpg, name, stack }) {

    return (
        <div class="team">
            <div class="team-profile">
                <div class="profile-name">{name}</div>
                <img class="team-profile-image" src={`${jpg}`} alt="profile image" />
                <div class="profile-name">{stack}</div>
            </div>
            {/* <div class="info">hello</div> */}
        </div>
    );
}