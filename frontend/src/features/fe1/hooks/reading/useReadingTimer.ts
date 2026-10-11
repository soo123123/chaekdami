import { useEffect, useState } from 'react';
/** Initial UI timer; background accuracy can be improved with timestamps later. */
export function useReadingTimer() { const [elapsedSeconds, setElapsedSeconds] = useState(0); const [isRunning, setIsRunning] = useState(false); useEffect(() => { if (!isRunning) return; const id = setInterval(() => setElapsedSeconds(v => v + 1), 1000); return () => clearInterval(id); }, [isRunning]); return { elapsedSeconds, isRunning, start: () => setIsRunning(true), pause: () => setIsRunning(false), reset: () => { setIsRunning(false); setElapsedSeconds(0); } }; }
