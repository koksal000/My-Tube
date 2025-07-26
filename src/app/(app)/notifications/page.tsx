import { BellRing, ThumbsUp, MessageCircle, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const notifications = [
    {
        id: 1,
        icon: <UserPlus className="h-5 w-5 text-green-500" />,
        text: "Teknoloji Gurusu kanalına abone oldu.",
        time: "15 dakika önce",
    },
    {
        id: 2,
        icon: <ThumbsUp className="h-5 w-5 text-blue-500" />,
        text: "Müzik Ruhu, 'Akustik Cover' videonuzu beğendi.",
        time: "1 saat önce",
    },
    {
        id: 3,
        icon: <MessageCircle className="h-5 w-5 text-purple-500" />,
        text: "Gezgin Kamera, 'Norveç Fiyortları' videonuza yorum yaptı: 'İnanılmaz görüntüler!'",
        time: "3 saat önce",
    },
     {
        id: 4,
        icon: <BellRing className="h-5 w-5 text-primary" />,
        text: "Müzik Ruhu yeni bir video yükledi: 'Stüdyo Günlükleri #5'",
        time: "dün",
    },
];


export default function NotificationsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Bildirimler</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Son Bildirimler</CardTitle>
                </CardHeader>
                <CardContent>
                   {notifications.length > 0 ? (
                       <div className="space-y-4">
                           {notifications.map(notification => (
                               <div key={notification.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary">
                                   <div className="flex-shrink-0">{notification.icon}</div>
                                   <div className="flex-grow">
                                       <p className="text-sm">{notification.text}</p>
                                       <p className="text-xs text-muted-foreground">{notification.time}</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   ) : (
                    <div className="text-center text-muted-foreground py-20">
                        <p className="text-lg">Yeni bildirim yok.</p>
                    </div>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}

    