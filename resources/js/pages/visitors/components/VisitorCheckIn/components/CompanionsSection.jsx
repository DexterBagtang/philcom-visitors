import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, UserPlus, AlertCircle, Info } from "lucide-react";
import { CompanionCard } from './CompanionCard';

export function CompanionsSection({
    companions,
    errors,
    onAdd,
    onUpdate,
    onRemove,
    disabled,
    defaultPersonToVisit = ''
}) {
    const maxCompanions = 20;
    const canAddMore = companions.length < maxCompanions;

    const handleAdd = () => {
        onAdd(defaultPersonToVisit);
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                        Companions/Guest
                    </h2>
                    <Badge variant="outline" className="text-xs">
                        Optional
                    </Badge>
                    {companions.length > 0 && (
                        <Badge variant="secondary">{companions.length}</Badge>
                    )}
                </div>
            </div>

            {/* Info message */}
            <Alert className="bg-muted/50 border-muted">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                    {companions.length === 0
                        ? "Visiting alone? You can skip this section."
                        : `You may add up to ${maxCompanions} companions.`
                    }
                </AlertDescription>
            </Alert>

            {/* Validation errors */}
            {errors.companions && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.companions}</AlertDescription>
                </Alert>
            )}

            {/* Companion cards */}
            {companions.length > 0 && (
                <div className="space-y-2">
                    {companions.map((companion, index) => (
                        <CompanionCard
                            key={index}
                            index={index}
                            companion={companion}
                            errors={errors}
                            onUpdate={(field, value) => onUpdate(index, field, value)}
                            onRemove={() => onRemove(index)}
                            disabled={disabled}
                        />
                    ))}
                </div>
            )}

            {/* Add companion button - always at the bottom */}
            <div className="pt-1">
                <Button
                    type="button"
                    onClick={handleAdd}
                    variant="outline"
                    size="lg"
                    className="w-full touch-manipulation active:scale-95 transition-transform"
                    disabled={disabled || !canAddMore}
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {companions.length === 0 ? 'Add Companion' : 'Add Another Companion'}
                </Button>
                {!canAddMore && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Maximum of {maxCompanions} companions reached
                    </p>
                )}
            </div>
        </div>
    );
}
