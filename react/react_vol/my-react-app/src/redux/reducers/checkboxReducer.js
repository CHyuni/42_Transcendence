import { TOGGLE_AVAIL_CHECK, TOGGLE_GAME_CHECK, TOGGLE_QUEUE_CHECK } from "../actions/checkboxActions"

const initalState = {
  availChecked: true,
  gameChecked: true,
  queueChecked: true,
};

const checkboxReducer = (state = initalState, action) => {
  switch (action.type) {
    case TOGGLE_AVAIL_CHECK:
      return {
        ...state,
        availChecked: !state.availChecked,
      };
    case TOGGLE_GAME_CHECK:
      return {
        ...state,
        gameChecked: !state.gameChecked,
      };
    case TOGGLE_QUEUE_CHECK:
      return {
        ...state,
        queueChecked: !state.queueChecked,
      };

    default:
      return state;
  }
};

export default checkboxReducer;