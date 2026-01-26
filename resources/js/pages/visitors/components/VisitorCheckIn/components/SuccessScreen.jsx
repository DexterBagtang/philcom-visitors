import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users, UserPlus } from "lucide-react";

export function SuccessScreen({ groupSize, countdown, onRegisterAnother }) {
    const isGroupCheckin = groupSize > 1;

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
            <Card className="max-w-md w-full text-center p-6">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Thank You!</h2>

                    {isGroupCheckin && (
                        <Badge variant="secondary" className="mb-3">
                            <Users className="w-3 h-3 mr-1" />
                            Group of {groupSize} registered
                        </Badge>
                    )}

                    <p className="text-muted-foreground mb-4">
                        {isGroupCheckin
                            ? `Your group of ${groupSize} has been registered successfully. Each member will receive a separate badge at the reception desk.`
                            : 'Your details have been submitted successfully. Please proceed to the reception desk for validation and badge issuance.'
                        }
                    </p>

                    {/* Next Steps */}
                    <div className="bg-blue-100 p-5 rounded-lg text-left w-full mb-6 border border-blue-200">
                        <h3 className="text-base font-bold text-blue-900 mb-2">Next Steps</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                            <li>
                                <span className="font-semibold">
                                    {isGroupCheckin ? 'Each member should present their ID' : 'Present your ID'}
                                </span> to the reception staff
                            </li>
                            <li>
                                <span className="font-semibold">
                                    {isGroupCheckin ? 'Each member will receive a visitor badge' : 'Receive your visitor badge'}
                                </span>
                            </li>
                        </ol>
                    </div>

                    {/* Action Button */}
                    <div className="w-full">
                        <Button
                            onClick={onRegisterAnother}
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
