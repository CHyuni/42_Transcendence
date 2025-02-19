import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import TransparentToast from './components/TransparentToast';
import ConfirmModal from './components/ConfirmModal';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  // Toast 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastMode, setToastMode] = useState('')

  const timerRef = useRef(null);

  // Modal 상태
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    mode: '',
  });

  // Toast 보여주기
  const showToastMessage = (message, time, mode) => {
    return new Promise(resolve => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToastMessage(message);
      setShowToast(true);
      setToastMode(mode);
      timerRef.current = setTimeout(() => {
        setShowToast(false);
        timerRef.current = null;
        resolve();
      }, time);
    });
  };

  // Confirm Modal 보여주기
  const showConfirmModal = (message, onConfirm, onCancel, mode) => {
    return new Promise((resolve) => {
      setModalConfig({
        message,
        onConfirm: (inputText) => {
          resolve(onConfirm(inputText));
          setShowModal(false);
        },
        onCancel: () => {
          resolve(onCancel());
          setShowModal(false);
        },
        mode
      });
      setShowModal(true);
    })
  };

  return (
    <NotificationContext.Provider value={{ showToastMessage, showConfirmModal }}>
      {children}
      {showToast && (
        <TransparentToast
          message={toastMessage}
          mode={toastMode}
        />
      )}
      {showModal && (
        <ConfirmModal
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={modalConfig.onCancel}
          mode={modalConfig.mode}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);