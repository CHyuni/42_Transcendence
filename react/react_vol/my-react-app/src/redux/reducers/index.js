import { combineReducers } from "redux";
import checkboxReducer from "./checkboxReducer";
import { friendReducer, profileReducer } from "./friendReducer";
import { modeReducer, tournaReducer, tourCustomReducer } from "./gameReducer";


const rootReducer = combineReducers({
  checkboxReducer,
  friendReducer,
  profileReducer,
  modeReducer,
  tournaReducer,
  tourCustomReducer,
});

export default rootReducer;