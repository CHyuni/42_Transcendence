import React, { useEffect, useState } from "react";
import "./stats.css"
import ApiRequests from "./ApiRequests";
import { useSelector } from 'react-redux';

export default function StatCard({user, myProfile}) {
    const [matches, setMatches] = useState([]);
    const [blockchainMatches, setBlockchainMatches] = useState([]);

    useEffect(() => {
        async function processBlockchainMatches() {
          if (user === 'blockchain') {
            const processedMatches = [];
            const reversedMatches = [...matches].reverse(); 
            for (const match of reversedMatches) {
              try {
                const p1 = await getProfile(match.winner);
                const p2 = await getProfile(match.loser);
    
                if (!p1 || !p2) {
                  console.warn("프로필 정보를 가져오는데 실패했습니다. match:", match);
                  continue; // 프로필을 가져오지 못하면 이 매치를 건너뜁니다.
                }
                const mode = match.mode === 1 ? 'Round1' : 'Round2';
    
                processedMatches.push({
                  ...match,
                  p1,
                  p2,
                  mode,
                });
              } catch (error) {
                console.error("매치 처리 중 오류 발생:", error);
                // 오류 발생 시 처리 (예: 사용자에게 알림, 로깅 등)
              }
            }
            setBlockchainMatches(processedMatches);
          } else {
            setBlockchainMatches([]); // blockchain이 아니면 초기화
          }
        }
    
        processBlockchainMatches();
    }, [matches]);

    useEffect(() => {
        if (user === 'blockchain') {
            const fetchMatches = async () => {
                try {
                    const response = await ApiRequests('/api/tournaments/get_all/');
                    setMatches(response.data);
                } catch (error) {
                    console.error('Failed to fetch matches:', error);
                }
            };
            fetchMatches();
        }
        else {
            const fetchMatches = async () => {
                try {
                    const response = await ApiRequests(`/api/match_stat/?id=${myProfile.userid}&mode=${myProfile.mode}`, {
                        method: 'GET'
                    });
                    setMatches(response);
                } catch (error) {
                    console.error('Failed to fetch matches:', error);
                }
            };
            fetchMatches();
        }
    }, [myProfile]);

    const getPlayerInfo = (match) => {
        // 내가 player1인 경우
        if (match.player1 === myProfile.userid) {
            return {
                me: {
                    username: match.player1_username,
                    beforeRating: match.player1_before_rating,
                    afterRating: match.player1_after_rating,
                    image: match.player1_image,
                },
                opponent: {
                    username: match.player2_username,
                    beforeRating: match.player2_before_rating,
                    afterRating: match.player2_after_rating,
                    image: match.player2_image,

                }
            };
        }
        // 내가 player2인 경우
        return {
            me: {
                username: match.player2_username,
                beforeRating: match.player2_before_rating,
                afterRating: match.player2_after_rating,
                image: match.player2_image,

            },
            opponent: {
                username: match.player1_username,
                beforeRating: match.player1_before_rating,
                afterRating: match.player1_after_rating,
                image: match.player1_image,
            }
        };
    };
    const getProfile = async (match) => {
        const data = await ApiRequests(`/api/user/${match}/profile/`);
        return data;
    }

    if (user === 'blockchain') {
        return (
            <>
                {blockchainMatches.map((match, index) => (
                    <div key={index} className="stats-row" id="stats-win">
                        <div className="stats-user-container">
                        <div className="stats-user">
                            <img
                            className="stats-user-img"
                            src={match.p1.image || "default.jpg"}
                            alt="me"
                            />
                            <span className="stats-user-id">
                            {match.p1.username}
                            </span>
                        </div>
                        <div>
                            <img
                            className="stats-versus"
                            src="versus5.png"
                            alt="versus"
                            />
                        </div>
                        <div className="stats-user">
                            <img
                            className="stats-user-img"
                            src={match.p2.image || "default.jpg"}
                            alt="opponent"
                            />
                            <span className="stats-user-id">
                            {match.p2.username}
                            </span>
                        </div>
                        </div>
                        <div className="stats-mode-container">
                        <span className="statsmode">{match.mode}-Mode</span>
                        </div>
                        <div className="stats-result-container">
                        <span className="stats-result">
                            {`${match.p1.username} WIN`}
                        </span>
                        </div>
                    </div>
                ))}
            </>
        )
    }
    return (
        <>
            {matches.map((match, index) => {
                const players = getPlayerInfo(match);
                const ratingChange = players.me.afterRating - players.me.beforeRating;

                return (
                    <div key={index} className="stats-row" id="stats-win">
                        <div className="stats-user-container">
                            <div className="stats-user">
                                <img
                                    className="stats-user-img" 
                                    src={players.me.image || "default.jpg"}
                                    alt="me"
                                />
                                <span className="stats-user-id">
                                    {players.me.username}({players.me.beforeRating})
                                </span>
                            </div>
                            <div>
                                <img
                                    className="stats-versus"
                                    src="versus5.png"
                                    alt="versus"
                                />
                            </div>
                            <div className="stats-user">
                                <img
                                    className="stats-user-img" 
                                    src={players.opponent.image || "default.jpg"}
                                    alt="opponent"
                                />
                                <span className="stats-user-id">
                                    {players.opponent.username}({players.opponent.beforeRating})
                                </span>
                            </div>
                            <div className="stats-date-container">
                                <span className="stats-date">
                                    {match.match_date.split('T')[0].replace(/-/g, '.')}
                                </span>
                            </div>
                        </div>
                        <div className="stats-rating-container">
                            <span className="stats-rating">
                                {players.me.beforeRating} 
                                <img
                                    className="stats-arrow" 
                                    src="arrow.png"
                                    alt="arrow"
                                />
                                {players.me.afterRating}
                            </span>
                            <span className="rating-change">
                                ({ratingChange > 0 ? '+' : ''}{ratingChange})
                            </span>
                        </div>
                        <div className="stats-mode-container">
                            <span className="statsmode">{match.mode}-Mode</span>
                        </div>
                        <div className="stats-result-container">
                            <span className="stats-result">
                                {match.winner === myProfile.userid ? "WIN" : "LOSE"}
                            </span>
                        </div>
                    </div>
                );
            })}
        </>
    );
}