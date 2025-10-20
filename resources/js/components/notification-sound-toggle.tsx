import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { notificationSound, unlockNotificationSound } from '@/lib/notification-sound';
import { toast } from 'sonner';

export function NotificationSoundToggle() {
    const [isEnabled, setIsEnabled] = useState(notificationSound.isEnabled());
    const [isUnlocked, setIsUnlocked] = useState(notificationSound.isAudioUnlocked());

    useEffect(() => {
        // Sync state with the notification sound manager
        setIsEnabled(notificationSound.isEnabled());
        setIsUnlocked(notificationSound.isAudioUnlocked());
    }, []);

    const handleToggle = async () => {
        // Ensure audio is unlocked first
        if (!isUnlocked) {
            const unlocked = await unlockNotificationSound();
            setIsUnlocked(unlocked);
        }

        const newState = notificationSound.toggle();
        setIsEnabled(newState);
        
        if (newState) {
            toast.success('Notification sounds enabled', {
                duration: 2000,
            });
            // Play a test sound
            notificationSound.test();
        } else {
            toast.info('Notification sounds disabled', {
                duration: 2000,
            });
        }
    };

    const handleTest = async () => {
        // Ensure audio is unlocked first
        if (!isUnlocked) {
            const unlocked = await unlockNotificationSound();
            setIsUnlocked(unlocked);
            
            if (!unlocked) {
                toast.error('Please click again to enable sound', {
                    duration: 2000,
                });
                return;
            }
        }

        notificationSound.test();
        toast.info('Playing test notification sound', {
            duration: 2000,
        });
    };

    const handleDropdownOpen = async () => {
        // Try to unlock audio when dropdown opens
        if (!isUnlocked) {
            const unlocked = await unlockNotificationSound();
            setIsUnlocked(unlocked);
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && handleDropdownOpen()}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    title={isEnabled ? 'Notifications enabled' : 'Notifications disabled'}
                >
                    {isEnabled ? (
                        <Bell className="h-5 w-5" />
                    ) : (
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    {!isEnabled && (
                        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Notification Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleToggle} className="cursor-pointer">
                    {isEnabled ? (
                        <>
                            <VolumeX className="mr-2 h-4 w-4" />
                            <span>Disable Sounds</span>
                        </>
                    ) : (
                        <>
                            <Volume2 className="mr-2 h-4 w-4" />
                            <span>Enable Sounds</span>
                        </>
                    )}
                </DropdownMenuItem>

                {isEnabled && (
                    <DropdownMenuItem onClick={handleTest} className="cursor-pointer">
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Test Sound</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {isEnabled ? (
                        'You will hear sounds when new visitors check in'
                    ) : (
                        'Notification sounds are currently disabled'
                    )}
                </div>

                {!isUnlocked && isEnabled && (
                    <div className="mt-2 border-t pt-2 px-2 py-1.5 text-xs text-amber-600 bg-amber-50 rounded-md">
                        ⚠️ Click "Test Sound" to activate audio
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
