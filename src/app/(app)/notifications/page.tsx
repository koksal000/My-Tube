"use client"

import { BellRing, ThumbsUp, MessageCircle, UserPlus, GitMerge, Video, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useMemo } from "react";
import type { Notification, User } from "@/lib/types";
import { getCurrentUser } from "@/lib/data";
import { getNotificationsAction, markNotificationsAsReadAction } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function timeAgo(dateString: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl önce";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay önce";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün önce";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " saat önce";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dakika önce";
    return "az önce";
}

const NotificationItem = ({ notification }: { notification: Notification }) => {
    let icon = <BellRing className="h-5 w-5 text-gray-500" />;
    let text: React.ReactNode = notification.text;
    let link = '/';

    switch(notification.type) {
        case "subscribe":
            icon = <UserPlus className="h-5 w-5 text-green-500" />;
            text = <p><span className="font-semibold">{notification.sender?.displayName}</span> kanalınıza abone oldu.</p>
            link = `/channel/${notification.sender?.username}`;
            break;
        case "like":
            icon = <ThumbsUp className="h-5 w-5 text-blue-500" />;
            text = <p><span className="font-semibold">{notification.sender?.displayName}</span>, içeriğinizi beğendi.</p>;
            link = `/video/${notification.contentId}?type=${notification.contentType}`;
            break;
        case "comment":
            icon = <MessageCircle className="h-5 w-5 text-purple-500" />;
            text = <p><span className="font-semibold">{notification.sender?.displayName}</span> içeriğinize yorum yaptı: &quot;{notification.text}&quot;</p>;
            link = `/video/${notification.contentId}?type=${notification.contentType}`;
            break;
        case "new_video":
            icon = <Video className="h-5 w-5 text-primary" />;
            text = <p><span className="font-semibold">{notification.sender?.displayName}</span> yeni bir video yükledi.</p>;
            link = `/video/${notification.contentId}`;
            break;
        case "mention":
            icon = <GitMerge className="h-5 w-5 text-yellow-500" />;
            text = <p><span className="font-semibold">{notification.sender?.displayName}</span> bir yorumda sizden bahsetti: &quot;{notification.text}&quot;</p>;
            link = `/video/${notification.contentId}?type=${notification.contentType}`;
            break;
        case "message":
            icon = <MessageSquare className="h-5 w-5 text-cyan-500" />;
            text = <p><span className="font-semibold">{notification.sender?.displayName}</span> size bir mesaj gönderdi.</p>;
            link = `/messages?to=${notification.sender?.username}`;
            break;
    }

    return (
        <Link href={link} className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${notification.read ? 'hover:bg-secondary' : 'bg-primary/10 hover:bg-primary/20'}`}>
            <Avatar className="h-10 w-10">
                <AvatarImage src={notification.sender?.profilePicture} alt={notification.sender?.displayName} data-ai-hint="person face" />
                <AvatarFallback>{(notification.sender?.displayName || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="text-sm">{text}</div>
                <p className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</p>
            </div>
            <div className="flex-shrink-0 mt-1">{icon}</div>
        </Link>
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
        return null;
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
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Settings state
    const [showLikes, setShowLikes] = useState(true);
    const [showSubs, setShowSubs] = useState(true);
    const [showMentions, setShowMentions] = useState(true);

     useEffect(() => {
        const fetchUserAndNotifications = async () => {
            setLoading(true);
            const user = await getCurrentUser();
            if (user) {
                setCurrentUser(user);
                const userNotifications = await getNotificationsAction(user.id);
                setNotifications(userNotifications);
                
                // Mark notifications as read
                if (userNotifications.some(n => !n.read)) {
                    await markNotificationsAsReadAction(user.id);
                }

            } else {
                router.push('/login');
            }
            setLoading(false);
        }
        fetchUserAndNotifications();

        // Load settings from localStorage
        setShowLikes(getSettingFromStorage('myTube-notify-likesAndComments', true));
        setShowSubs(getSettingFromStorage('myTube-notify-subscriptions', true));
        setShowMentions(getSettingFromStorage('myTube-notify-mentions', true));

    }, [router]);
    
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const type = n.type;
            if((type === 'like' || type === 'comment' || type === 'reply') && !showLikes) return false;
            if(type === 'subscribe' && !showSubs) return false;
            if(type === 'mention' && !showMentions) return false;
            return true;
        })
    }, [notifications, showLikes, showSubs, showMentions]);

    const mentionsAndReplies = useMemo(() => {
        return filteredNotifications.filter(n => n.type === 'mention' || n.type === 'reply');
    }, [filteredNotifications]);

    if (loading) {
        return <div>Bildirimler yükleniyor...</div>
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Bildirimler</h1>
             <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-4">
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="mentions">Bahsedenler</TabsTrigger>
                    <TabsTrigger value="replies">Yanıtlar</TabsTrigger> {/* This is not a real type yet */}
                    <TabsTrigger value="settings">Ayarlar</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <Card>
                        <CardContent className="p-2">
                           {filteredNotifications.length > 0 ? (
                               <div className="space-y-2">
                                   {filteredNotifications.map(notification => (
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
                           {mentionsAndReplies.length > 0 ? (
                               <div className="space-y-2">
                                   {mentionsAndReplies.map(notification => (
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
                           {mentionsAndReplies.length > 0 ? (
                               <div className="space-y-2">
                                   {mentionsAndReplies.map(notification => (
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
