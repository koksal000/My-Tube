"use client"

import { BellRing, ThumbsUp, MessageCircle, UserPlus, GitMerge, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const notifications = {
    all: [
        { id: 1, type: "subscribe", user: { name: "Teknoloji Gurusu", avatar: "https://placehold.co/100x100.png" }, time: "2 saat önce" }
    ],
    mentions: [
        { id: 4, type: "mention", user: { name: "Müzik Tutkunu", avatar: "https://placehold.co/100x100.png" }, comment: "@GezginKamera bu harika bir çekim!", videoTitle: "Akustik Cover", time: "1 gün önce" },
    ],
    replies: [
         { id: 3, type: "comment", user: { name: "Teknoloji Gurusu", avatar: "https://placehold.co/100x100.png" }, comment: "Harika bir analiz, tebrikler!", videoTitle: "Geleceğin Telefonları", time: "8 saat önce" },
    ]
};
const allNotifications = [...notifications.all, ...notifications.mentions, ...notifications.replies]

const NotificationItem = ({ notification }: { notification: any }) => {
    let icon = <BellRing className="h-5 w-5 text-gray-500" />;
    let text: React.ReactNode = notification.text;

    switch(notification.type) {
        case "subscribe":
            icon = <UserPlus className="h-5 w-5 text-green-500" />;
            text = <p><span className="font-semibold">{notification.user.name}</span> kanalınıza abone oldu.</p>
            break;
        case "like":
            icon = <ThumbsUp className="h-5 w-5 text-blue-500" />;
            text = <p><span className="font-semibold">{notification.user.name}</span>, '<span className="italic">{notification.videoTitle}</span>' videonuzu beğendi.</p>
            break;
        case "comment":
            icon = <MessageCircle className="h-5 w-5 text-purple-500" />;
            text = <p><span className="font-semibold">{notification.user.name}</span>, '<span className="italic">{notification.videoTitle}</span>' videonuza yorum yaptı: &quot;{notification.comment}&quot;</p>
            break;
        case "new_video":
            icon = <Video className="h-5 w-5 text-primary" />;
            text = <p><span className="font-semibold">{notification.user.name}</span> yeni bir video yükledi: '<span className="italic">{notification.videoTitle}</span>'</p>
            break;
        case "mention":
            icon = <GitMerge className="h-5 w-5 text-yellow-500" />;
            text = <p><span className="font-semibold">{notification.user.name}</span> bir yorumda sizden bahsetti: &quot;{notification.comment}&quot;</p>
            break;
    }


    return (
        <div key={notification.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary">
            <Avatar className="h-10 w-10">
                <AvatarImage src={notification.user.avatar} alt={notification.user.name} data-ai-hint="person face" />
                <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="text-sm">{text}</div>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
            </div>
            <div className="flex-shrink-0 mt-1">{icon}</div>
        </div>
    );
};


export default function NotificationsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Bildirimler</h1>
             <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-4">
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="mentions">Bahsedenler</TabsTrigger>
                    <TabsTrigger value="replies">Yanıtlar</TabsTrigger>
                    <TabsTrigger value="settings">Ayarlar</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <Card>
                        <CardContent className="p-2">
                           {allNotifications.length > 0 ? (
                               <div className="space-y-2">
                                   {allNotifications.map(notification => (
                                       <NotificationItem key={notification.id} notification={notification} />
                                   ))}
                               </div>
                           ) : (
                            <div className="text-center text-muted-foreground py-20">
                                <p className="text-lg">Yeni bildirim yok.</p>
                            </div>
                           )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="mentions">
                     <Card>
                        <CardContent className="p-2">
                           {notifications.mentions.length > 0 ? (
                               <div className="space-y-2">
                                   {notifications.mentions.map(notification => (
                                       <NotificationItem key={notification.id} notification={notification} />
                                   ))}
                               </div>
                           ) : (
                            <div className="text-center text-muted-foreground py-20">
                                <p className="text-lg">Sizden bahseden bildirim yok.</p>
                            </div>
                           )}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="replies">
                     <Card>
                        <CardContent className="p-2">
                           {notifications.replies.length > 0 ? (
                               <div className="space-y-2">
                                   {notifications.replies.map(notification => (
                                       <NotificationItem key={notification.id} notification={notification} />
                                   ))}
                               </div>
                           ) : (
                            <div className="text-center text-muted-foreground py-20">
                                <p className="text-lg">Yanıt bildiriminiz yok.</p>
                            </div>
                           )}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="settings">
                    <div className="text-center text-muted-foreground py-20">
                        <p className="text-lg">Bildirim ayarları yakında burada olacak.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
