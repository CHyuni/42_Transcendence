import React, { useEffect, useState } from "react";

import CheckBox from "./CheckBox";

const checkbox = [
    {
        id: 0,
        state: "avail",
        text: "Avail"
    },
    {
        id: 1,
        state: "game",
        text: "In Game"
    },
    {
        id: 2,
        state: "queue",
        text: "In Queue"
    },
]

export default function CheckBoxDiv() {
    useEffect(() => {

    }, []);

    return (
            <div class="online-checkbox-container">
                {checkbox.map((box) => (
                    <CheckBox key={box.id}
                            state={box.state} 
                            text={box.text}
                    />
                ))}
            </div>
    );
}