# Notification Sound Setup

This project includes a notification sound system that plays when a new visitor checks in via Laravel Reverb.

## What's Already Implemented

1. **Notification Sound Manager** (`resources/js/lib/notification-sound.ts`)
   - Handles playing notification sounds
   - Manages user preferences (enable/disable)
   - Supports volume control
   - Stores preferences in localStorage

2. **Notification Toggle Component** (`resources/js/components/notification-sound-toggle.tsx`)
   - UI toggle button in the app header
   - Dropdown menu with enable/disable options
   - Test sound functionality
   - Visual indicator when sounds are disabled

3. **Real-time Integration** (`resources/js/pages/dashboard/components/TodaysVisitorsTable.jsx`)
   - Listens to `VisitCreated` event via Laravel Reverb
   - Plays notification sound automatically
   - Shows toast notification
   - Reloads visitor data

## Adding the Notification Sound File

You need to add a notification sound file to make this work:

### Option 1: Use a Free Sound (Recommended)

1. Download a notification sound from a free source:
   - **Pixabay**: https://pixabay.com/sound-effects/search/notification/
   - **Freesound**: https://freesound.org/search/?q=notification
   - **Zapsplat**: https://www.zapsplat.com/sound-effect-category/notifications/

2. Save the file as `notification.mp3` or `notification.ogg` in:
   ```
   public/sounds/notification.mp3
   ```

### Option 2: Create a Simple Sound Using Browser

If you want a simple beep sound, you can use this JavaScript code to generate one:

```javascript
// Run this in browser console and download
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

oscillator.frequency.value = 800;
oscillator.type = 'sine';
gainNode.gain.value = 0.3;

oscillator.start();
oscillator.stop(audioContext.currentTime + 0.3);
```

### Option 3: Use System Sound

You can also record a system notification sound from your computer.

## Recommended Sound Files

Here are some suggested characteristics for the notification sound:
- **Duration**: 0.3 - 1.5 seconds
- **Format**: MP3 or OGG (MP3 has better browser support)
- **Volume**: Not too loud (we set it to 60% in code)
- **Type**: Pleasant "ding" or "chime" sound
- **File size**: Keep it small (< 50KB)

## Testing the Notification

1. Make sure the sound file is at `public/sounds/notification.mp3`
2. Open the app in your browser
3. Click the bell icon in the header
4. Click "Test Sound" in the dropdown menu
5. You should hear the notification sound

## Troubleshooting

### Sound doesn't play
- Check browser console for errors
- Verify the sound file exists at `public/sounds/notification.mp3`
- Check if browser audio is muted
- Some browsers require user interaction before playing audio

### Sound plays but is too loud/quiet
- Adjust volume in the code:
  ```typescript
  // In notification-sound.ts
  this.audio.volume = 0.6; // Change this value (0.0 to 1.0)
  ```

### Sound is disabled after testing
- Check the bell icon - if it shows a "BellOff" icon, sounds are disabled
- Click the bell icon and select "Enable Sounds"
- Preference is saved in localStorage

## Files Modified/Created

### New Files
- `resources/js/lib/notification-sound.ts` - Sound manager utility
- `resources/js/components/notification-sound-toggle.tsx` - UI toggle component
- `public/sounds/` - Directory for sound files

### Modified Files
- `resources/js/components/app-header.tsx` - Added notification toggle
- `resources/js/pages/dashboard/components/TodaysVisitorsTable.jsx` - Added sound playback on visit creation

## Future Enhancements

Consider adding:
- Multiple sound options (let users choose their favorite)
- Volume slider in the settings
- Different sounds for different event types
- Desktop notifications (using Notification API)
- Sound customization per user
