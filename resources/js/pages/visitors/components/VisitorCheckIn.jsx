import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle2, Loader2, User, Building2, RotateCcw, UserPlus, Clock } from "lucide-react";
import { Separator } from '@/components/ui/separator.js';

const VisitorCheckIn = () => {
    const { flash } = usePage().props;
    const [submitted, setSubmitted] = useState(false);
    const [isOtherType, setIsOtherType] = useState(false);
    const [isOtherPurpose, setIsOtherPurpose] = useState(false);
    const [clientErrors, setClientErrors] = useState({});
    const [countdown, setCountdown] = useState(20); // 10 seconds countdown
    const [isCountdownActive, setIsCountdownActive] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        company: '',
        person_to_visit: '',
        visit_purpose: '',
        visit_purpose_other: '',
        visitor_type: '',
        visitor_type_other: ''
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
            setCountdown(20); // Reset to 10 seconds
        }
    }, [submitted]);

    // Client-side validation matching backend rules
    const validateForm = () => {
        const newErrors = {};

        if (!data.name.trim()) {
            newErrors.name = "Name is required.";
        } else if (data.name.length > 255) {
            newErrors.name = "Name cannot exceed 255 characters.";
        }

        if (data.company && data.company.length > 255) {
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
        if (!validateForm()) return;

        post('/visitor/check-in', {
            onSuccess: () => {
                setSubmitted(true);
                reset();
                setIsOtherType(false);
                setIsOtherPurpose(false);
                setClientErrors({});
            }
        });
    };

    const handleReturnToForm = () => {
        setSubmitted(false);
        setIsCountdownActive(false);
        setCountdown(10);
        setIsOtherType(false);
        setIsOtherPurpose(false);
        setClientErrors({});

        // Explicitly reset all form data
        setData({
            name: '',
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
                                <li><span className="font-semibold">Wait for your host</span> to be notified</li>
                            </ol>
                        </div>


                        {/* Countdown Display */}
                        {/*<div className="bg-gray-50 p-3 rounded-lg w-full mb-4 border border-gray-200">*/}
                        {/*    <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">*/}
                        {/*        <Clock className="w-4 h-4" />*/}
                        {/*        <span className="text-xs font-medium">Auto-return in</span>*/}
                        {/*    </div>*/}
                        {/*    <div className="text-xl font-semibold text-gray-700 mb-1">*/}
                        {/*        {countdown}s*/}
                        {/*    </div>*/}
                        {/*    <div className="w-full bg-gray-200 rounded-full h-1.5">*/}
                        {/*        <div*/}
                        {/*            className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"*/}
                        {/*            style={{ width: `${(countdown / 10) * 100}%` }}*/}
                        {/*        ></div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}


                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button
                                onClick={handleRegisterAnother}
                                variant="default"
                                className="flex-1"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Register Another Visitor
                            </Button>

                            <Button
                                onClick={handleReturnToForm}
                                variant="outline"
                                className="flex-1"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Return to Form
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-4">
                            The form will automatically reset in {countdown} seconds
                        </p>
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
                        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                            <UserPlus className="w-7 h-7 text-primary" />
                            Visitor Check-in
                        </h1>
                        <p className="text-muted-foreground">
                            Please fill in your details to check in
                        </p>
                        {/*<div className="mt-2 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">*/}
                        {/*    <CheckCircle2 className="w-4 h-4" />*/}
                        {/*    This is the official visitor check-in form*/}
                        {/*</div>*/}
                    </div>
                </CardHeader>

                <CardContent>
                    {flash?.error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{flash.error}</AlertDescription>
                        </Alert>
                    )}
                    {flash?.success && (
                        <Alert className="mb-4">
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>{flash.success}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* --- Your Details --- */}
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <User className="w-5 h-5 text-primary" /> Your Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {/* Visitor Type */}
                                <div>
                                    <Label>Visitor Type *</Label>
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
                                            <SelectItem value="Visitor">Visitor</SelectItem>
                                            <SelectItem value="Client">Client</SelectItem>
                                            <SelectItem value="Contractor">Contractor</SelectItem>
                                            <SelectItem value="Vendor">Vendor</SelectItem>
                                            <SelectItem value="Applicant">Applicant</SelectItem>
                                            <SelectItem value="Delivery Personnel">Delivery Personnel</SelectItem>
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
                                        <Label>Specify Visitor Type *</Label>
                                        <Input
                                            value={data.visitor_type_other}
                                            onChange={(e) => setData('visitor_type_other', e.target.value)}
                                            disabled={processing}
                                            placeholder="Enter custom visitor type"
                                        />
                                        {(clientErrors.visitor_type_other || errors.visitor_type_other) && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {clientErrors.visitor_type_other || errors.visitor_type_other}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Name */}
                                <div>
                                    <Label>Full Name *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        disabled={processing}
                                        placeholder="e.g. John Doe"
                                    />
                                    {(clientErrors.name || errors.name) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {clientErrors.name || errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Company */}
                                <div>
                                    <Label>Company/Organization</Label>
                                    <Input
                                        value={data.company}
                                        onChange={(e) => setData('company', e.target.value)}
                                        disabled={processing}
                                        placeholder="e.g. Acme Corp"
                                    />
                                    {(clientErrors.company || errors.company) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {clientErrors.company || errors.company}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <hr className="border-t" />

                        {/* --- Host & Visit Info --- */}
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <Building2 className="w-5 h-5 text-primary" /> Host & Visit Information
                            </h2>

                            {/* Person to Visit */}
                            <div className="mb-4">
                                <Label>Person to Visit *</Label>
                                <Input
                                    value={data.person_to_visit}
                                    onChange={(e) => setData('person_to_visit', e.target.value)}
                                    disabled={processing}
                                    placeholder="e.g. Jane Smith (HR Department)"
                                />
                                {(clientErrors.person_to_visit || errors.person_to_visit) && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {clientErrors.person_to_visit || errors.person_to_visit}
                                    </p>
                                )}
                            </div>

                            {/* Purpose */}
                            <div className="mb-4">
                                <Label>Purpose of Visit *</Label>
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
                                        <SelectItem value="Meeting">Meeting</SelectItem>
                                        <SelectItem value="Official Business">Official Business</SelectItem>
                                        <SelectItem value="Delivery">Delivery (Invoice, Receipts, etc.)</SelectItem>
                                        <SelectItem value="Collection / Payment">Collection / Payment</SelectItem>
                                        <SelectItem value="Billing">Billing</SelectItem>
                                        <SelectItem value="Submit Documents / Requirements">Submit Documents / Requirements</SelectItem>
                                        <SelectItem value="Interview">Interview</SelectItem>
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
                                    <Label>Specify Purpose *</Label>
                                    <Input
                                        value={data.visit_purpose_other}
                                        onChange={(e) => setData('visit_purpose_other', e.target.value)}
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

                        {/* Submit */}
                        <Button type="submit" className="w-full" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {processing ? "Submitting..." : "Submit Check-in Details"}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                            By submitting this form, you agree to our visitor policies and consent to the collection of your information for security purposes.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default VisitorCheckIn;
