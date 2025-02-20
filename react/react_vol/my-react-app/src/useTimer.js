import { useEffect, useState } from 'react';
import { WS_CONFIG } from './config';

const useTimer = (condition, onTimeout) => {
  const [tries, setTries] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    const timecheck = async (currentTry) => {
      if (!condition || tries >= WS_CONFIG.MAX_TRIES) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
        setTries(0);
        setIsRunning(false);
        if (tries >= WS_CONFIG.MAX_TRIES) onTimeout();
        return;
      }
      setTries((prev) => {
        console.log('timecheck:', prev);
        const newTries = prev + 1;
        const newTimeoutId = setTimeout(() => timecheck(newTries), WS_CONFIG.TIMEOUT_MS);
        setTimeoutId(newTimeoutId);
        return newTries;
      });
    };

    if (condition && !isRunning) {
      setTries(0);
      setIsRunning(true);
      const newTimeoutId = setTimeout(() => timecheck(0), WS_CONFIG.TIMEOUT_MS);
      setTimeoutId(newTimeoutId);
    }

    return () => {
      if (timeoutId) {
        console.log('Clearing timeout');
        clearTimeout(timeoutId);
      }
    };
  }, [condition, isRunning, onTimeout]);

  return { reset: () => setTries(0) };
};

export default useTimer;