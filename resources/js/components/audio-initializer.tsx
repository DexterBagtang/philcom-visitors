import { useEffect } from 'react';
import { unlockNotificationSound } from '@/lib/notification-sound';

/**
 * Component that handles audio initialization on user interaction
 * Place this in your main layout to ensure audio works properly
 */
export function AudioInitializer() {
    useEffect(() => {
        // List of events that indicate user interaction
        const events = ['click', 'touchstart', 'keydown'];
        
        const handleInteraction = async () => {
            await unlockNotificationSound();
            
            // Remove listeners after first unlock attempt
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };

        // Add listeners
        events.forEach(event => {
            document.addEventListener(event, handleInteraction, { once: true });
        });

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };
    }, []);

    // This component doesn't render anything
    return null;
}
