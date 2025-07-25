import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Notifications</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-20">
                        <p className="text-lg">No new notifications.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
