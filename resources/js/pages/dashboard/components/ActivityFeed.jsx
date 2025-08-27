'use client';

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";

export default function ActivityFeed() {
    const [activities, setActivities] = useState([
        { id: 1, type: "check-in", visitor: "John Doe", time: "09:15 AM" },
        { id: 2, type: "check-out", visitor: "Jane Smith", time: "10:02 AM" },
        { id: 3, type: "new-visitor", visitor: "Michael Brown", time: "10:20 AM" },
    ]);

    // Example of simulating real-time activity feed
    useEffect(() => {
        const interval = setInterval(() => {
            const randomEvents = [
                { type: "check-in", label: "checked in" },
                { type: "check-out", label: "checked out" },
                { type: "new-visitor", label: "registered" },
            ];
            const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
            const newActivity = {
                id: Date.now(),
                type: event.type,
                visitor: ["Alice", "Bob", "Charlie", "David"][Math.floor(Math.random() * 4)],
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setActivities((prev) => [newActivity, ...prev]);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const getBadge = (type) => {
        switch (type) {
            case "check-in":
                return <Badge className="bg-green-100 text-green-800">Check-in</Badge>;
            case "check-out":
                return <Badge className="bg-red-100 text-red-800">Check-out</Badge>;
            case "new-visitor":
                return <Badge className="bg-blue-100 text-blue-800">New Visitor</Badge>;
            default:
                return null;
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Live Activity Feed
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[1000px] pr-4">
                    {activities.map((activity, index) => (
                        <div key={activity.id}>
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <p className="text-sm font-medium">{activity.visitor}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.type === "check-in"
                                            ? "Checked in"
                                            : activity.type === "check-out"
                                                ? "Checked out"
                                                : "Registered as a visitor"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getBadge(activity.type)}
                                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                                </div>
                            </div>
                            {index < activities.length - 1 && <Separator />}
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
