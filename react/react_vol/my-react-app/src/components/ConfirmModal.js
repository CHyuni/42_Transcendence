import React, { useEffect, useState } from "react";
import "./ConfirmModal.css"

const ConfirmModal = ({ message, onConfirm, onCancel, mode }) => {
  const [timer, setTimer] = useState(10);
  const [inputText, setInputText] = useState('');
  useEffect(() => {
    if (mode === 'tournament')
      return;
    if (timer <= 0) {
      onCancel();
      return;
    }

    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, onCancel]);

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };
  
  const handleConfirm = () => {
    onConfirm(inputText);
  };

  if (mode === 'tournament') {
    return (
      <div className = 'modalContainer'>
        <p className = 'modalMessage'>{message}</p>
        <input type="text" value={inputText} onChange={handleInputChange}  className="modalInput"/>
        <div class = "buttonContainer">
          <button onClick={handleConfirm} class = 'confirmButton'>제출</button>
          <button onClick={onCancel} class = 'cancelButton'>매칭 취소</button>
        </div>
      </div>
    )
  }
  else {
    return (
      <div class = "modalContainer">
        <p class = "modalMessage">{message}</p>
        <div class = "buttonContainer">
          {timer}
         <button onClick={onConfirm} class = "confirmButton">수락</button>
         <button onClick={onCancel} class = "cancelButton">취소</button>
        </div>
      </div>
    );
  }
  };
  
  export default ConfirmModal;