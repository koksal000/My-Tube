"use client"

import { BellRing, ThumbsUp, MessageCircle, UserPlus, GitMerge, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const notifications = {
    all: [
        { id: 1, type: "subscribe", user: { name: "Teknoloji Gurusu", avatar: "data:image/jpeg;base64,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" }
]
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
