import React from 'react';
import "./TransparentToast.css";

const TransparentToast = ({ message, mode }) => {
  const toastClass = `${mode === 'game' ? "start-notice" : "notice"}`;
  return (
    <div class = {toastClass}>
      <span>{message}</span>
    </div>
  );
}
export default TransparentToast;