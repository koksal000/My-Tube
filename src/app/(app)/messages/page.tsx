import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessagesPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Direkt Mesajlar</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Sohbetler</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-20">
                        <p className="text-lg">Aktif sohbet bulunmuyor.</p>
                        <p>Yeni bir mesaja bir kullanıcının kanal sayfasından başlayın.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
