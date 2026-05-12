import { useState, useRef, useEffect, useCallback } from 'react';

export function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const show = useCallback((text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { msg, show };
}
