import React from "react";

const WinLossBar = ({wins, losses} ) => {
  const totalGames = wins + losses;

  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) / 100 : 0;
  const lossRate = totalGames > 0 ? Math.round((losses / totalGames) * 100) / 100 : 0;

  return (
    <div class="winlossbar-container">
      <div class="winlossbar-header">
        <div class="win-count">{wins}</div>
        <div class="lose-count">{losses}</div>
      </div>
      <div class="winlossbar">
        <div class="winbar"
          style={{
            width: `${winRate * 100}%`,
          }}
        ></div>
        <div class="lossbar"
          style={{
            width: `${lossRate * 100}%`,
          }}
        ></div>
      </div>
      <div class="winloss-percent">
        <span class="win-percent">{winRate}% Win</span>
        <span class="lose-percent">{lossRate}% Lose</span>
      </div>
    </div>
  );
};

export default WinLossBar;
