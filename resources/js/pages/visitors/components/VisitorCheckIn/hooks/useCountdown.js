import { useState, useEffect } from 'react';

export function useCountdown(initialSeconds, onComplete) {
    const [countdown, setCountdown] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let intervalId;

        if (isActive && countdown > 0) {
            intervalId = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0 && isActive) {
            onComplete?.();
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isActive, countdown, onComplete]);

    const start = () => {
        setCountdown(initialSeconds);
        setIsActive(true);
    };

    const stop = () => {
        setIsActive(false);
        setCountdown(initialSeconds);
    };

    return { countdown, isActive, start, stop };
}
