import React from "react";
import "./stats.css"
import StatCard from "./StatCard";

export default function Stats({myProfile, user}) {
    return (
        <div class="stats-outer-container">
            <div class="stats-header-container">
                <span class="stats-header">Stats</span>
            </div>
            <div class="stats-body-container">
                <div class="stathead-row">
                    <div class="stathead-user-container">
                        <div class="stathead">
                            <span class="stats-user-id">User</span>
                        </div>
                    </div>
                    <div class="stathead-rating-container">
                        <div class="stathead">
                            <span class="stats-rating">Rating</span>
                        </div>
                    </div>
                    <div class="stathead-mode-container">
                        <div class="stathead">
                            <span class="statsmode">Mode</span>
                        </div>
                    </div>
                    <div class="stathead-result-container">
                        <div class="stathead">
                            <span class="stats-result">Result</span>
                        </div>
                    </div>
                </div>
                <StatCard user={user} myProfile={myProfile}/>
            </div>
        </div>
    )
}