import React, { useEffect, useState } from 'react';
import "./TournamentDisplay.css"

const TournamentDisplay = ({onClose}) => {
  const [matches, setMatches] = useState([]);
  
  useEffect(() => {
    const initialMatches = [
      {
        id: '1',
        player1: 'jaeskim',
        player2: 'jiskim',
        score1: 2,
        score2: 0,
        nextMatchId: '5',
        tournamentRoundText: 'Round of 8'
      },
      {
        id: '2',
        player1: 'seunpark',
        player2: 'gpaeng',
        score1: 2,
        score2: 1,
        nextMatchId: '5',
        tournamentRoundText: 'Round of 8'
      },
      {
        id: '3',
        player1: 'spark',
        player2: 'jaeyojun',
        score1: 0,
        score2: 2,
        nextMatchId: '6',
        tournamentRoundText: 'Round of 8'
      },
      {
        id: '4',
        player1: 'yongmkim',
        player2: 'junhpark',
        score1: 2,
        score2: 0,
        nextMatchId: '6',
        tournamentRoundText: 'Round of 8'
      },
      {
        id: '5',
        player1: 'jaeskim',
        player2: 'seunpark',
        score1: null,
        score2: null,
        nextMatchId: '7',
        tournamentRoundText: 'Semi Finals'
      },
      {
        id: '6',
        player1: 'jaeyojun',
        player2: 'yongmkim',
        score1: null,
        score2: null,
        nextMatchId: '7',
        tournamentRoundText: 'Semi Finals'
      },
      {
        id: '7',
        player1: '',
        player2: '',
        score1: null,
        score2: null,
        tournamentRoundText: 'Final'
      }
    ];

    setMatches(initialMatches);
  }, []);

  const updateMatch = (updatedMatch) => {
    setMatches(prevMatches => {
      const newMatches = [...prevMatches];
      const matchIndex = newMatches.findIndex(m => m.id === updatedMatch.id);
      
      if (matchIndex !== -1) {
        newMatches[matchIndex] = updatedMatch;
        
        if (updatedMatch.winner && updatedMatch.nextMatchId) {
          const nextMatch = newMatches.find(m => m.id === updatedMatch.nextMatchId);
          if (nextMatch) {
            const isFirstPlayer = Number(updatedMatch.id) % 2 === 1;
            if (isFirstPlayer) {
              nextMatch.player1 = updatedMatch.winner;
            } else {
              nextMatch.player2 = updatedMatch.winner;
            }
          }
        }
      }
      
      return newMatches;
    });
  };

  const roundsMap = matches.reduce((acc, match) => {
    if (!acc[match.tournamentRoundText]) {
      acc[match.tournamentRoundText] = [];
    }
    acc[match.tournamentRoundText].push(match);
    return acc;
  }, {});

  const rounds = Object.entries(roundsMap);

  const MatchCard = ({ match }) => {
    const isCompleted = match.score1 !== null && match.score2 !== null;
    const winner = isCompleted ? (match.score1 > match.score2 ? match.player1 : match.player2) : null;

    return (
      <div className="match-card">
        <div className={`player-info ${winner === match.player1 ? 'winner' : ''}`}>
          <span className="player-name">{match.player1 || 'TBD'}</span>
          <span className="score">{match.score1 ?? '-'}</span>
        </div>
        <div className={`player-info ${winner === match.player2 ? 'winner' : ''}`}>
          <span className="player-name">{match.player2 || 'TBD'}</span>
          <span className="score">{match.score2 ?? '-'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h1 className="title">42 Tournament Center</h1>
        <div className="tournament-bracket"></div>
        {rounds.map(([roundName, roundMatches], roundIndex) => (
          <div key={roundName} className="round-column">
            <h2 className="round-title">{roundName}</h2>
            <div className="matches-column">
              {roundMatches.map((match) => (
                <div 
                  key={match.id} 
                  className="match-wrapper"
                  style={{
                    marginTop: `${roundIndex > 0 ? Math.pow(2, roundIndex) * 2 : 0}rem`
                  }}
                >
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentDisplay;