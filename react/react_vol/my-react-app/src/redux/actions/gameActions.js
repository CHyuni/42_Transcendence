export const GAME_MODE_CHANGE = "GAME/MODE_CHANGE";
export const TOURNAMENT_UPDATE = 'TOUR/STATE_UPDATE';
export const TOURNAMENT_CUSTOM = 'TOUR/CUSTOM_UPDATE';

export const modeChange = (flag) => ({
	type: GAME_MODE_CHANGE,
	payload: { flag }
})

export const tournamentUpdate = (start, userData) => ({
	type: TOURNAMENT_UPDATE,
	payload: { ...userData, start }
})

export const tourCustom = (init, userData) => ({
	type: TOURNAMENT_CUSTOM,
	payload: { userData, init }
})