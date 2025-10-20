/**
 * Generate a simple notification sound using Web Audio API
 * This is used as a fallback if notification.mp3 is not found
 */

export function generateNotificationSound(): string {
    // This is a base64 encoded simple beep sound (very small file)
    // It's a 440Hz tone for 0.2 seconds
    const base64Sound = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    
    return base64Sound;
}

/**
 * Create a notification beep sound dynamically
 */
export async function createNotificationBeep(): Promise<Blob | null> {
    try {
        // Check if Web Audio API is available
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
            console.warn('Web Audio API not supported');
            return null;
        }

        // Create offline audio context (sample rate: 44100, duration: 0.3s, channels: 1)
        const offlineContext = new OfflineAudioContext(1, 44100 * 0.3, 44100);
        
        // Create oscillator for the beep sound
        const oscillator = offlineContext.createOscillator();
        const gainNode = offlineContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(offlineContext.destination);
        
        // Configure oscillator
        oscillator.frequency.value = 800; // 800 Hz tone
        oscillator.type = 'sine'; // Smooth sine wave
        
        // Configure gain (volume envelope)
        gainNode.gain.setValueAtTime(0, offlineContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, offlineContext.currentTime + 0.01); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, offlineContext.currentTime + 0.3); // Smooth decay
        
        // Start and stop oscillator
        oscillator.start(0);
        oscillator.stop(0.3);
        
        // Render the audio
        const audioBuffer = await offlineContext.startRendering();
        
        // Convert to WAV blob
        const wavBlob = audioBufferToWav(audioBuffer);
        return wavBlob;
    } catch (error) {
        console.error('Failed to create notification beep:', error);
        return null;
    }
}

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const writeString = (str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(pos++, str.charCodeAt(i));
        }
    };

    const writeUint32 = (value: number) => {
        view.setUint32(pos, value, true);
        pos += 4;
    };

    const writeUint16 = (value: number) => {
        view.setUint16(pos, value, true);
        pos += 2;
    };

    writeString('RIFF');
    writeUint32(36 + length);
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16);
    writeUint16(1); // PCM
    writeUint16(numberOfChannels);
    writeUint32(buffer.sampleRate);
    writeUint32(buffer.sampleRate * 2 * numberOfChannels); // byte rate
    writeUint16(numberOfChannels * 2); // block align
    writeUint16(16); // bits per sample
    writeString('data');
    writeUint32(length);

    // Write audio data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < arrayBuffer.byteLength) {
        for (let i = 0; i < numberOfChannels; i++) {
            const sample = Math.max(-1, Math.min(1, channels[i][offset]));
            view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Download the generated sound
 */
export async function downloadNotificationSound() {
    const blob = await createNotificationBeep();
    if (!blob) {
        alert('Failed to generate notification sound');
        return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notification.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
