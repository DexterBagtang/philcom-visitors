import { useEffect, useRef, useState } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import '@/../../resources/css/keyboard.css';
import { KeyboardIcon } from 'lucide-react';

/**
 * VirtualKeyboard - A reusable virtual keyboard component
 *
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {function} props.onChange - Callback when keyboard input changes
 * @param {boolean} props.visible - Whether keyboard is visible
 * @param {string} props.placeholder - Placeholder text for empty input
 * @param {string} props.className - Additional CSS classes for container
 */
export default function VirtualKeyboard({
    value = '',
    onChange,
    visible = false,
    placeholder = 'Use keyboard below',
    className = ''
}) {
    const keyboardRef = useRef(null);
    const [layoutName, setLayoutName] = useState('default');

    // Sync keyboard with input changes from parent
    useEffect(() => {
        if (keyboardRef.current && visible) {
            keyboardRef.current.setInput(value);
        }
    }, [value, visible]);

    const handleKeyboardChange = (input) => {
        if (onChange) {
            onChange(input);
        }
    };

    const handleKeyPress = (button) => {
        // Handle shift for uppercase letters only (keep numbers visible)
        if (button === '{shift}' || button === '{lock}') {
            setLayoutName(layoutName === 'default' ? 'shift' : 'default');
        }
    };

    if (!visible) {
        return null;
    }

    return (
        <div className={`rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-4 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}>
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-900">Virtual Keyboard</span>
                </div>
            </div>

            <Keyboard
                keyboardRef={(r) => (keyboardRef.current = r)}
                layoutName={layoutName}
                onChange={handleKeyboardChange}
                onKeyPress={handleKeyPress}
                theme="hg-theme-default hg-layout-default"
                layout={{
                    default: [
                        '1 2 3 4 5 6 7 8 9 0 {bksp}',
                        'q w e r t y u i o p',
                        'a s d f g h j k l',
                        '{shift} z x c v b n m - {shift}',
                        '{space}',
                    ],
                    shift: [
                        '1 2 3 4 5 6 7 8 9 0 {bksp}',
                        'Q W E R T Y U I O P',
                        'A S D F G H J K L',
                        '{shift} Z X C V B N M - {shift}',
                        '{space}',
                    ],
                }}
                display={{
                    '{bksp}': '⌫',
                    '{shift}': '⇧ Shift',
                    '{space}': 'Space',
                }}
                buttonTheme={[
                    {
                        class: 'hg-blue-button',
                        buttons: '{bksp} {shift} {space}',
                    },
                ]}
            />
        </div>
    );
}
