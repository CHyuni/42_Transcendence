import { TOGGLE_FRIEND, PROFILE_FRIEND } from "../actions/friendActions"

const initialState = {
  idx: -1,
  profileIdx: false,
  userData: {},
  chatData: {  // 채팅 데이터 추가
    name: '',
    texts: []
  }
};

export const friendReducer = (state = initialState, action) => {
  switch (action.type) {
      case TOGGLE_FRIEND:
          // console.log("TOGGLE_FRIEND action received:", action.payload);
          return {
              ...state,
              idx: action.payload  // 객체가 아닌 직접 값을 저장
          };
      default:
          return state;
  }
};

export const profileReducer = (state = initialState, action) => {
  switch (action.type) {
    case PROFILE_FRIEND:
      return {
        ...state,
        profileIdx: !state.profileIdx,
        userData: action.payload,
      };
    default:
      return state;
  }
};
