import { useState, useRef, useEffect } from 'react';

export function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  function show(text) {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3000);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return { msg, show };
}
