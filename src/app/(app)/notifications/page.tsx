"use client"

import { BellRing, ThumbsUp, MessageCircle, UserPlus, GitMerge, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

// Real notification data would be fetched from a service.
// For the prototype, we'll start with an empty array.
const allNotifications: any[] = [];
const mentions: any[] = [];
const replies: any[] = [];

// Helper functions to interact with localStorage
const getSettingFromStorage = (key: string, defaultValue: boolean): boolean => {
    if (typeof window === 'undefined') return defaultValue;
    const savedValue = localStorage.getItem(key);
    return savedValue !== null ? JSON.parse(savedValue) : defaultValue;
}

const setSettingInStorage = (key: string, value: boolean) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
    }
}


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
                <AvatarFallback>{(notification.user.name || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="text-sm">{text}</div>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
            </div>
            <div className="flex-shrink-0 mt-1">{icon}</div>
        </div>
    );
};

const NotificationSettings = () => {
    const [likesAndComments, setLikesAndComments] = useState(true);
    const [subscriptions, setSubscriptions] = useState(true);
    const [mentions, setMentions] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setLikesAndComments(getSettingFromStorage('myTube-notify-likesAndComments', true));
        setSubscriptions(getSettingFromStorage('myTube-notify-subscriptions', true));
        setMentions(getSettingFromStorage('myTube-notify-mentions', true));
    }, []);

    const handleSettingChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, key: string) => (checked: boolean) => {
        setter(checked);
        setSettingInStorage(key, checked);
    };

    if (!isMounted) {
        return null; // or a loading skeleton
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
                <CardDescription>Hangi etkileşimler için bildirim almak istediğinizi seçin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="likes-comments" className="flex flex-col space-y-1">
                        <span>Beğeniler ve Yorumlar</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            İçeriklerinize gelen beğeniler ve yorumlar hakkında bildirim alın.
                        </span>
                    </Label>
                    <Switch 
                        id="likes-comments" 
                        checked={likesAndComments}
                        onCheckedChange={handleSettingChange(setLikesAndComments, 'myTube-notify-likesAndComments')}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="subscriptions" className="flex flex-col space-y-1">
                        <span>Abonelikler</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Kanalınıza yeni birisi abone olduğunda bildirim alın.
                        </span>
                    </Label>
                    <Switch 
                        id="subscriptions" 
                        checked={subscriptions}
                        onCheckedChange={handleSettingChange(setSubscriptions, 'myTube-notify-subscriptions')}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="mentions" className="flex flex-col space-y-1">
                        <span>Bahsetmeler</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Birisi bir yorumda veya gönderide sizden bahsettiğinde haberdar olun.
                        </span>
                    </Label>
                    <Switch 
                        id="mentions" 
                        checked={mentions}
                        onCheckedChange={handleSettingChange(setMentions, 'myTube-notify-mentions')}
                    />
                </div>
            </CardContent>
        </Card>
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
                           {mentions.length > 0 ? (
                               <div className="space-y-2">
                                   {mentions.map(notification => (
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
                           {replies.length > 0 ? (
                               <div className="space-y-2">
                                   {replies.map(notification => (
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
                    <NotificationSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
