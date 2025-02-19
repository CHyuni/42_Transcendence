import React, { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { toggleAvailCheck, toggleGameCheck, toggleQueueCheck } from './redux/actions/checkboxActions';

export default function CheckBox({ state, text }) {
    // useEffect(() => {

    // }, []);

    const dispatch = useDispatch();
  
    const checkboxState = useSelector((state) => 
        text === "Avail" ? state.checkboxReducer.availChecked
        : text === "In Game" ? state.checkboxReducer.gameChecked
        : state.checkboxReducer.queueChecked
    );

    const handleToggleCheck = () => {
        if (state == "avail")
            dispatch(toggleAvailCheck());
        else if (state == "game")
            dispatch(toggleGameCheck());
        else
            dispatch(toggleQueueCheck());
    };

    return (
                <div class={`form-check ${state == "avail" ? "" : "online-checkbox"}`}>
                    <input 
                        class="form-check-input" 
                        type="checkbox" 
                        value="" 
                        id={`flexCheckChecked ${state}`} 
                        checked={checkboxState}
                        onChange={handleToggleCheck}
                    />
                    <label class={`form-check-label ${state}`} for={`flexCheckChecked ${state}`}>
                        {text}
                    </label>
                </div>
    );
}