import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessagesPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Direct Messages</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-20">
                        <p className="text-lg">No active conversations.</p>
                        <p>Start a new message from a user's channel page.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
