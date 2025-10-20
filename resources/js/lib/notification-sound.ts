/**
 * Notification Sound Manager
 * Handles playing notification sounds with fallback support and autoplay policy handling
 */

export class NotificationSound {
    private audio: HTMLAudioElement | null = null;
    private enabled: boolean = true;
    private isUnlocked: boolean = false;
    private soundPath: string;

    constructor(soundPath: string = '/sounds/notification.mp3') {
        this.soundPath = soundPath;
        this.initializeAudio(soundPath);
        this.loadPreference();
        this.setupAutoplayUnlock();
    }

    private initializeAudio(soundPath: string) {
        try {
            this.audio = new Audio(soundPath);
            this.audio.preload = 'auto';
            
            // Set volume to a comfortable level (0.0 to 1.0)
            this.audio.volume = 0.6;

            // Listen for successful load
            this.audio.addEventListener('canplaythrough', () => {
                console.log('Notification sound loaded successfully');
            });

            // Listen for errors
            this.audio.addEventListener('error', (e) => {
                console.warn('Failed to load notification sound:', e);
            });
        } catch (error) {
            console.error('Failed to initialize notification sound:', error);
        }
    }

    private setupAutoplayUnlock() {
        // List of events that indicate user interaction
        const unlockEvents = ['click', 'touchstart', 'keydown'];
        
        const unlock = async () => {
            if (this.isUnlocked || !this.audio) return;
            
            try {
                // Try to play and immediately pause to unlock audio context
                this.audio.volume = 0;
                const playPromise = this.audio.play();
                
                if (playPromise !== undefined) {
                    await playPromise;
                    this.audio.pause();
                    this.audio.currentTime = 0;
                    this.audio.volume = 0.6;
                    this.isUnlocked = true;
                    
                    console.log('Audio unlocked - notifications are ready');
                    
                    // Remove event listeners after successful unlock
                    unlockEvents.forEach(event => {
                        document.removeEventListener(event, unlock);
                    });
                }
            } catch (error) {
                // Silent fail - will try again on next interaction
            }
        };

        // Add listeners for user interactions
        unlockEvents.forEach(event => {
            document.addEventListener(event, unlock, { once: false });
        });
    }

    private loadPreference() {
        try {
            const stored = localStorage.getItem('notification-sound-enabled');
            this.enabled = stored === null ? true : stored === 'true';
        } catch (error) {
            // If localStorage fails, default to enabled
            this.enabled = true;
        }
    }

    /**
     * Play the notification sound
     */
    async play() {
        if (!this.enabled || !this.audio) {
            return;
        }

        try {
            // Reset the audio to start if it's already playing
            this.audio.currentTime = 0;
            
            // Play the sound
            const playPromise = this.audio.play();
            
            if (playPromise !== undefined) {
                await playPromise;
                this.isUnlocked = true; // Mark as unlocked if successful
            }
        } catch (error) {
            if (error instanceof Error) {
                // Check if it's an autoplay error
                if (error.name === 'NotAllowedError') {
                    console.warn('Notification sound blocked by browser. Waiting for user interaction...');
                    // Don't show error to user - just wait for next interaction
                } else {
                    console.warn('Failed to play notification sound:', error.message);
                }
            }
        }
    }

    /**
     * Enable notification sounds
     */
    enable() {
        this.enabled = true;
        try {
            localStorage.setItem('notification-sound-enabled', 'true');
        } catch (error) {
            console.warn('Failed to save notification preference');
        }
    }

    /**
     * Disable notification sounds
     */
    disable() {
        this.enabled = false;
        try {
            localStorage.setItem('notification-sound-enabled', 'false');
        } catch (error) {
            console.warn('Failed to save notification preference');
        }
    }

    /**
     * Toggle notification sounds on/off
     */
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }

    /**
     * Check if notifications are enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Check if audio is unlocked (user has interacted with page)
     */
    isAudioUnlocked() {
        return this.isUnlocked;
    }

    /**
     * Set the volume (0.0 to 1.0)
     */
    setVolume(volume: number) {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Test the notification sound
     */
    async test() {
        return this.play();
    }

    /**
     * Manually unlock audio (useful for explicit user actions)
     */
    async unlock() {
        if (this.isUnlocked || !this.audio) return true;
        
        try {
            this.audio.volume = 0;
            const playPromise = this.audio.play();
            
            if (playPromise !== undefined) {
                await playPromise;
                this.audio.pause();
                this.audio.currentTime = 0;
                this.audio.volume = 0.6;
                this.isUnlocked = true;
                return true;
            }
        } catch (error) {
            console.warn('Failed to unlock audio:', error);
            return false;
        }
        return false;
    }
}

// Create a singleton instance
export const notificationSound = new NotificationSound('/sounds/notification.mp3');

// Export convenience functions
export const playNotificationSound = () => notificationSound.play();
export const toggleNotificationSound = () => notificationSound.toggle();
export const isNotificationSoundEnabled = () => notificationSound.isEnabled();
export const unlockNotificationSound = () => notificationSound.unlock();
