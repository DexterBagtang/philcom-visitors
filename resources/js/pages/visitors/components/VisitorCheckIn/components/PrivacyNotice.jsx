import { RequiredMark } from './RequiredMark';

export function PrivacyNotice({ agreed, onAgreeChange, disabled }) {
    return (
        <div className="space-y-4">
            {/* Privacy Notice Text */}
            <div className="text-sm text-gray-700 leading-relaxed">
                <p className="mb-4">
                    I understand that Philippine Global Communications, Inc. (Philcom) including its
                    subsidiaries, affiliates, and related companies,
                    as well as its
                    partners and service providers, if any, and
                    hereby authorize them to collect, store and
                    process my personal data for the purpose of
                    entering the premises of Philcom Headquarters
                    submitted through visitor access system.
                </p>

                <ol className="list-decimal list-inside space-y-1 mb-4">
                    <li>First Name - Visitor Identification</li>
                    <li>Last Name - Visitor Identification</li>
                    <li>Company - Visitor Identification</li>
                </ol>

                <p className="mb-4">
                    For more information about how we use and
                    protect your data, how we comply with the Data
                    Privacy Act of 2012 (R.A. 10173), you may visit
                    Philcom's Privacy Notice{" "}
                    <a
                        href="https://www.philcom.com/privacy.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                    >
                        https://www.philcom.com/privacy.php
                    </a>.
                </p>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start space-x-3">
                <input
                    type="checkbox"
                    id="agree"
                    name="privacy_agreement"
                    checked={agreed}
                    onChange={(e) => onAgreeChange(e.target.checked)}
                    disabled={disabled}
                    className="mt-1 w-4 h-4"
                />
                <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                    Yes, I agree <RequiredMark />
                </label>
            </div>
        </div>
    );
}
