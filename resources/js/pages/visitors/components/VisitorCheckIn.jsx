import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle2, Loader2, User, Building2, UserPlus } from "lucide-react";
import { Separator } from '@/components/ui/separator.js';

/**
 * Capitalizes the first letter of each word without changing the rest
 * Example: "john doe" -> "John Doe", "IBM" -> "IBM", "mcdonald" -> "Mcdonald"
 */
const toTitleCase = (text) => {
    if (!text) return text;
    return text
        .split(' ')
        .map(word => {
            if (!word) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

const VisitorCheckIn = () => {
    const { flash } = usePage().props;
    const [submitted, setSubmitted] = useState(false);
    const [isOtherType, setIsOtherType] = useState(false);
    const [isOtherPurpose, setIsOtherPurpose] = useState(false);
    const [clientErrors, setClientErrors] = useState({});
    const [countdown, setCountdown] = useState(60); // 60 seconds countdown
    const [isCountdownActive, setIsCountdownActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-click

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        company: '',
        person_to_visit: '',
        visit_purpose: '',
        visit_purpose_other: '',
        visitor_type: '',
        visitor_type_other: '',
        agree: false,
    });

    // Countdown effect
    useEffect(() => {
        let intervalId;

        if (isCountdownActive && countdown > 0) {
            intervalId = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0 && isCountdownActive) {
            // Auto return to form when countdown reaches 0
            handleReturnToForm();
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isCountdownActive, countdown]);

    // Start countdown when form is submitted successfully
    useEffect(() => {
        if (submitted) {
            setIsCountdownActive(true);
            setCountdown(60); // Reset to 60 seconds
        }
    }, [submitted]);

    // Client-side validation matching backend rules
    const validateForm = () => {
        const newErrors = {};

        if (!data.first_name.trim()) {
            newErrors.first_name = "Name is required.";
        } else if (data.first_name.length > 255) {
            newErrors.first_name = "Name cannot exceed 255 characters.";
        }

        if (!data.last_name.trim()) {
            newErrors.last_name = "Name is required.";
        } else if (data.last_name.length > 255) {
            newErrors.last_name = "Name cannot exceed 255 characters.";
        }

        if (!data.company.trim()) {
            newErrors.company = "Company/Organization is required.";
        } else if (data.company && data.company.length > 255) {
            newErrors.company = "Company cannot exceed 255 characters.";
        }

        if (!data.person_to_visit.trim()) {
            newErrors.person_to_visit = "Person to visit is required.";
        } else if (data.person_to_visit.length > 255) {
            newErrors.person_to_visit = "Person to visit cannot exceed 255 characters.";
        }

        if (!data.visit_purpose.trim()) {
            newErrors.visit_purpose = "Purpose of visit is required.";
        } else if (data.visit_purpose.length > 1000) {
            newErrors.visit_purpose = "Purpose cannot exceed 1000 characters.";
        }

        if (data.visit_purpose === "Others") {
            if (!data.visit_purpose_other.trim()) {
                newErrors.visit_purpose_other = "Please specify the purpose.";
            } else if (data.visit_purpose_other.length > 255) {
                newErrors.visit_purpose_other = "Custom purpose cannot exceed 255 characters.";
            }
        }

        if (!data.visitor_type.trim()) {
            newErrors.visitor_type = "Visitor type is required.";
        }

        if (data.visitor_type === "Other") {
            if (!data.visitor_type_other.trim()) {
                newErrors.visitor_type_other = "Please specify the visitor type.";
            } else if (data.visitor_type_other.length > 255) {
                newErrors.visitor_type_other = "Custom visitor type cannot exceed 255 characters.";
            }
        }

        setClientErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting || processing) return;

        if (!validateForm()) return;

        // Set submitting flag immediately to prevent double-clicks
        setIsSubmitting(true);

        post('/visitor/check-in', {
            onSuccess: () => {
                setSubmitted(true);
                reset();
                setIsOtherType(false);
                setIsOtherPurpose(false);
                setClientErrors({});
                setIsSubmitting(false);
            },
            onError: () => {
                // Reset submitting state on error so user can retry
                setIsSubmitting(false);
            }
        });
    };

    const handleReturnToForm = () => {
        setSubmitted(false);
        setIsCountdownActive(false);
        setCountdown(60);
        setIsOtherType(false);
        setIsOtherPurpose(false);
        setClientErrors({});
        setIsSubmitting(false); // Reset submitting state

        // Explicitly reset all form data
        setData({
            first_name: '',
            last_name: '',
            company: '',
            person_to_visit: '',
            visit_purpose: '',
            visit_purpose_other: '',
            visitor_type: '',
            visitor_type_other: ''
        });
    };

    const handleRegisterAnother = () => {
        handleReturnToForm(); // Same functionality but different button for UX clarity
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted p-4">
                <Card className="max-w-md w-full text-center p-6">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                        <p className="text-muted-foreground mb-4">
                            Your details have been submitted successfully. Please proceed to the reception desk for validation and badge issuance.
                        </p>

                        {/* Next Steps */}
                        <div className="bg-blue-100 p-5 rounded-lg text-left w-full mb-6 border border-blue-200">
                            <h3 className="text-base font-bold text-blue-900 mb-2">Next Steps</h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                                <li><span className="font-semibold">Present your ID</span> to the reception staff</li>
                                <li><span className="font-semibold">Receive your visitor badge</span></li>
                            </ol>
                        </div>



                        {/* Action Button */}
                        <div className="w-full">
                            <Button
                                onClick={handleRegisterAnother}
                                variant="default"
                                className="w-full"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Register Another Visitor
                            </Button>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${(countdown / 60) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                The form will automatically reset in {countdown} seconds
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
            <Card className="max-w-2xl w-full">
                <CardHeader className="flex flex-col items-center gap-4">
                    <div className="w-full flex justify-center">
                        <img
                            src="/company_logo.png"
                            alt="Company Logo"
                            className="h-20 md:h-24 object-contain"
                        />
                    </div>
                    <Separator className="w-3/4 my-2" />

                    <div className="text-center">
                        <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                            <UserPlus className="w-7 h-7 text-primary" />
                            Visitors Form
                        </h3>
                        <p className="text-muted-foreground">
                            Please fill in your details.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            <RequiredMark /> indicates required fields
                        </p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Duplicate Error Alert */}
                        {errors.duplicate && (
                            <Alert variant="destructive">
                                <AlertTitle>Already Checked In</AlertTitle>
                                <AlertDescription>{errors.duplicate}</AlertDescription>
                            </Alert>
                        )}

                        {/* --- Your Details --- */}
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <User className="w-5 h-5 text-primary" /> Your Details
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                                {/* Name */}
                                <div>
                                    <Label>First Name  <RequiredMark /></Label>
                                    <Input
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', toTitleCase(e.target.value))}
                                        disabled={processing}
                                        placeholder="Enter First Name"
                                    />
                                    {(clientErrors.first_name || errors.first_name) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {clientErrors.first_name || errors.first_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Last Name <RequiredMark /></Label>
                                    <Input
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', toTitleCase(e.target.value))}
                                        disabled={processing}
                                        placeholder="Enter Last Name"
                                    />
                                    {(clientErrors.last_name || errors.last_name) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {clientErrors.last_name || errors.last_name}
                                        </p>
                                    )}
                                </div>

                                {/* Company */}
                                <div>
                                    <Label>Company/Organization <RequiredMark /></Label>
                                    <Input
                                        value={data.company}
                                        onChange={(e) => setData('company', toTitleCase(e.target.value))}
                                        disabled={processing}
                                        placeholder="Enter Company/Organization"
                                    />
                                    {(clientErrors.company || errors.company) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {clientErrors.company || errors.company}
                                        </p>
                                    )}
                                </div>

                                {/* Visitor Type */}
                                <div>
                                    <Label>Visitor Type <RequiredMark /></Label>
                                    <Select
                                        value={data.visitor_type}
                                        onValueChange={(value) => {
                                            setData('visitor_type', value);
                                            setIsOtherType(value === 'Other');
                                            if (value !== 'Other') setData('visitor_type_other', '');
                                        }}
                                        disabled={processing}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select visitor type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Contractor">Contractor</SelectItem>
                                            <SelectItem value="Vendor">Vendor</SelectItem>
                                            <SelectItem value="Visitor">Visitor</SelectItem>
                                            <SelectItem value="Client">Client</SelectItem>
                                            <SelectItem value="Delivery Personnel">Delivery Personnel</SelectItem>
                                            <SelectItem value="Applicant">Applicant</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>

                                    </Select>
                                    {(clientErrors.visitor_type || errors.visitor_type) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {clientErrors.visitor_type || errors.visitor_type}
                                        </p>
                                    )}
                                </div>

                                {/* If "Other" selected */}
                                {isOtherType && (
                                    <div className="mb-4">
                                        <Label>Specify Visitor Type <RequiredMark /></Label>
                                        <Input
                                            value={data.visitor_type_other}
                                            onChange={(e) => setData('visitor_type_other', toTitleCase(e.target.value))}
                                            disabled={processing}
                                            placeholder="Enter custom visitor type"
                                        />
                                        {(clientErrors.visitor_type_other || errors.visitor_type_other) && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {clientErrors.visitor_type_other || errors.visitor_type_other}
                                            </p>
                                        )}
                                    </div>
                                )}                            </div>
                        </div>

                        <hr className="border-t" />

                        {/* --- Host & Visit Info --- */}
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <Building2 className="w-5 h-5 text-primary" /> Host & Visit Information
                            </h2>

                            {/* Person to Visit */}
                            <div className="mb-4">
                                <Label>Person to Visit <RequiredMark /></Label>
                                <Input
                                    value={data.person_to_visit}
                                    onChange={(e) => setData('person_to_visit', toTitleCase(e.target.value))}
                                    disabled={processing}
                                    placeholder="Enter Person to visit"
                                />
                                {(clientErrors.person_to_visit || errors.person_to_visit) && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {clientErrors.person_to_visit || errors.person_to_visit}
                                    </p>
                                )}
                            </div>

                            {/* Purpose */}
                            <div className="mb-4">
                                <Label>Purpose of Visit <RequiredMark /></Label>
                                <Select
                                    value={data.visit_purpose}
                                    onValueChange={(value) => {
                                        setData('visit_purpose', value);
                                        setIsOtherPurpose(value === 'Others');
                                        if (value !== 'Others') setData('visit_purpose_other', '');
                                    }}
                                    disabled={processing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select purpose of visit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Official Business">Official Business</SelectItem>
                                        <SelectItem value="Meeting">Meeting</SelectItem>
                                        <SelectItem value="Delivery">Delivery</SelectItem>
                                        <SelectItem value="Collection">Collection</SelectItem>
                                        <SelectItem value="Payment">Payment</SelectItem>
                                        <SelectItem value="Billing">Billing</SelectItem>
                                        <SelectItem value="Submit Documents / Requirements">Submit Documents / Requirements</SelectItem>
                                        <SelectItem value="Interview">Interview</SelectItem>
                                        <SelectItem value="Repair/Maintenance">Repair/Maintenance</SelectItem>
                                        <SelectItem value="Others">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(clientErrors.visit_purpose || errors.visit_purpose) && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {clientErrors.visit_purpose || errors.visit_purpose}
                                    </p>
                                )}
                            </div>

                            {/* If "Others" selected */}
                            {isOtherPurpose && (
                                <div className="mb-4">
                                    <Label>Specify Purpose <RequiredMark /></Label>
                                    <Input
                                        value={data.visit_purpose_other}
                                        onChange={(e) => setData('visit_purpose_other', toTitleCase(e.target.value))}
                                        disabled={processing}
                                        placeholder="Enter custom purpose"
                                    />
                                    {(clientErrors.visit_purpose_other || errors.visit_purpose_other) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {clientErrors.visit_purpose_other || errors.visit_purpose_other}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Privacy Notice Agreement */}
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

                                {/*
                                <p className="mb-4">
                                    The foregoing information shall be retained in
                                    our system for 30 days or as required by
                                    applicable law and regulations for legitimate
                                    business purpose, after which the system shall
                                    securely delete the data.
                                </p>
                                */}

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
                                    checked={data.agree || false}
                                    onChange={(e) => setData("agree", e.target.checked)}
                                    disabled={processing}
                                    className="mt-1 w-4 h-4"
                                />
                                <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                                    Yes, I agree <RequiredMark />
                                </label>
                            </div>


                        </div>


                        {/* Submit */}
                        <Button type="submit" className="w-full" disabled={isSubmitting || processing || !data.agree}>
                            {(isSubmitting || processing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {(isSubmitting || processing) ? "Submitting..." : "Submit"}
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

function RequiredMark(){
    return (
        <span className="text-red-500">*</span>
    )
}

export default VisitorCheckIn;
