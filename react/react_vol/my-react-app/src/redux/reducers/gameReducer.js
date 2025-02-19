import { GAME_MODE_CHANGE, USER_RATING_UPDATE, TOURNAMENT_UPDATE, TOURNAMENT_CUSTOM } from "../actions/gameActions";

const modeInit = {
	mode: 'Casual Mod',
};

const userInit = {
	userData: {},
}

const tourInit = {
	start: false,
	userData: {},
}

const customInit = {
	userData: [],
}

export const modeReducer = (state = modeInit, action) => {
	switch (action.type) {
		case GAME_MODE_CHANGE:
			if (action.payload.flag === 1) {
				return {
					...state,
					mode: state.mode === 'Casual Mod' ? 'Tournament Mod' : 'Casual Mod',
				};
			} else {
				return {
					...state,
					mode: 'Casual Mod'
				}
			}
		default:
			return state;
	}
}

export const userReducer = (state = userInit, action) => {
	switch (action.type) {
		case USER_RATING_UPDATE:
			return {
				...state,
				userData: { ...state.userData, ...action.payload }
			}
		default:
			return state;
	}
}

export const tournaReducer = (state = tourInit, action) => {
	switch (action.type) {
		case TOURNAMENT_UPDATE:
			if (action.payload.start === 1) {
				return {
					...state,
					start: true,
					userData: { ...state.userData, ...action.payload }
				}	
			} else if (action.payload.start === 2) {
				return {
					...tourInit,
				}
			} else {
				return {
					...state,
					userData: { ...state.userData, ...action.payload }
				}
			}
		default:
			return state;
	}
}

export const tourCustomReducer = (state = customInit, action) => {
	switch (action.type) {
		case TOURNAMENT_CUSTOM:
			if (action.payload.init === 1) {
				return customInit
			} else {
				return {
					...state,
					userData: [
					  ...state.userData,
					  ...action.payload.userData.map(user => ({
						user_id: user.user_id,
						tournament_name: user.tournament_name,
					  })),
					],
				};
			}
		default:
			return state;
	}
}