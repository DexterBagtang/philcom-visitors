import React, { useState, useEffect } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus } from "lucide-react";
import { Separator } from '@/components/ui/separator.js';

import { SuccessScreen } from './components/SuccessScreen';
import { VisitorDetailsSection } from './components/VisitorDetailsSection';
import { HostVisitSection } from './components/HostVisitSection';
import { CompanionsSection } from './components/CompanionsSection';
import { PrivacyNotice } from './components/PrivacyNotice';
import { RequiredMark } from './components/RequiredMark';

import { useCountdown } from './hooks/useCountdown';
import { useCompanions } from './hooks/useCompanions';
import { useFormValidation } from './hooks/useFormValidation';

const VisitorCheckIn = () => {
    const { flash } = usePage().props;
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedGroupSize, setSubmittedGroupSize] = useState(1);

    const { data, setData, post, processing, errors: serverErrors, reset } = useForm({
        first_name: '',
        last_name: '',
        company: '',
        person_to_visit: '',
        visit_purpose: '',
        visit_purpose_other: '',
        visitor_type: '',
        visitor_type_other: '',
        agree: false,
        companions: [],
    });

    const companions = useCompanions();
    const validation = useFormValidation();

    const handleReturnToForm = () => {
        setSubmitted(false);
        setSubmittedGroupSize(1);
        setIsSubmitting(false);
        companions.clear();
        validation.clear();
        countdown.stop();
        reset();
    };

    const countdown = useCountdown(60, handleReturnToForm);

    // Start countdown when form is submitted
    useEffect(() => {
        if (submitted) {
            countdown.start();
        }
    }, [submitted]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isSubmitting || processing) return;

        // Merge all validation errors
        const allErrors = {
            ...validation.errors,
            ...companions.errors
        };

        if (!validation.validate(data, companions.companions)) {
            // Also set companion errors if any
            companions.setErrors(prev => ({ ...prev, ...validation.errors }));
            return;
        }

        setIsSubmitting(true);

        const isGroupCheckin = companions.companions.length > 0;
        const endpoint = isGroupCheckin ? '/visitor/check-in/group' : '/visitor/check-in';

        let submitData;
        if (isGroupCheckin) {
            submitData = {
                group_leader: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    company: data.company,
                    person_to_visit: data.person_to_visit,
                    visit_purpose: data.visit_purpose,
                    visit_purpose_other: data.visit_purpose_other,
                    visitor_type: data.visitor_type,
                    visitor_type_other: data.visitor_type_other,
                },
                companions: companions.companions
            };
        } else {
            submitData = {
                first_name: data.first_name,
                last_name: data.last_name,
                company: data.company,
                person_to_visit: data.person_to_visit,
                visit_purpose: data.visit_purpose,
                visit_purpose_other: data.visit_purpose_other,
                visitor_type: data.visitor_type,
                visitor_type_other: data.visitor_type_other,
            };
        }

        router.post(endpoint, submitData, {
            onSuccess: () => {
                setSubmittedGroupSize(isGroupCheckin ? companions.companions.length + 1 : 1);
                setSubmitted(true);
                reset();
                companions.clear();
                validation.clear();
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    // Combine client and server errors
    const allErrors = {
        ...validation.errors,
        ...companions.errors,
        ...serverErrors
    };

    if (submitted) {
        return (
            <SuccessScreen
                groupSize={submittedGroupSize}
                countdown={countdown.countdown}
                onRegisterAnother={handleReturnToForm}
            />
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
                        {serverErrors.duplicate && (
                            <Alert variant="destructive">
                                <AlertTitle>Already Checked In</AlertTitle>
                                <AlertDescription>{serverErrors.duplicate}</AlertDescription>
                            </Alert>
                        )}

                        {/* Visitor Details Section */}
                        <VisitorDetailsSection
                            data={data}
                            errors={allErrors}
                            hasCompanions={companions.companions.length > 0}
                            onChange={setData}
                            onClearError={validation.clearError}
                            disabled={processing}
                        />

                        <hr className="border-t" />

                        {/* Host & Visit Information Section */}
                        <HostVisitSection
                            data={data}
                            errors={allErrors}
                            onChange={setData}
                            onClearError={validation.clearError}
                            disabled={processing}
                        />

                        <hr className="border-t" />

                        {/* Companions Section */}
                        <CompanionsSection
                            companions={companions.companions}
                            errors={allErrors}
                            onAdd={companions.add}
                            onUpdate={companions.update}
                            onRemove={companions.remove}
                            disabled={processing}
                            defaultPersonToVisit={data.person_to_visit}
                        />

                        {/* Privacy Notice */}
                        <PrivacyNotice
                            agreed={data.agree}
                            onAgreeChange={(value) => setData('agree', value)}
                            disabled={processing}
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || processing || !data.agree}
                        >
                            {(isSubmitting || processing) && <Loader2 className="mr-2 h-4 h-4 animate-spin" />}
                            {(isSubmitting || processing) ? "Submitting..." :
                                companions.companions.length > 0
                                    ? `Submit Group (${companions.companions.length + 1} people)`
                                    : "Submit"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default VisitorCheckIn;
