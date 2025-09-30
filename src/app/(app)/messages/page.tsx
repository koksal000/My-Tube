"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { User, Message } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getMessagesAction, sendMessageAction } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useDatabase } from "@/lib/db";

const ChatMessage = ({ msg, isOwnMessage, author }: { msg: Message; isOwnMessage: boolean, author?: User }) => (
  <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : ''}`}>
    {!isOwnMessage && author && (
      <Avatar className="h-8 w-8">
        <AvatarImage src={author.profilePicture} alt={author.displayName || author.username} data-ai-hint="person face" />
        <AvatarFallback>{(author.displayName || author.username || 'U').charAt(0)}</AvatarFallback>
      </Avatar>
    )}
    <div className={`max-w-xs rounded-lg px-3 py-2 ${isOwnMessage ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-secondary'}`}>
      <p>{msg.text}</p>
      <p className="text-xs text-right mt-1 opacity-70">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
);


function MessagesChat({ currentUser }: { currentUser: User }) {
    const searchParams = useSearchParams();
    const routerUser = searchParams.get('to');
    const db = useDatabase();
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<User[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!db) return;
        const initConversations = async () => {
            const allUsers = await db.getAllUsers();
            const conversationUsers = allUsers.filter(u => u.id !== currentUser.id && u.username !== 'admin');
            setConversations(conversationUsers);
            
            if (routerUser) {
                const targetUser = await db.getUserByUsername(routerUser);
                if (targetUser) {
                   handleSelectConversation(targetUser);
                }
            }
        }
        initConversations();
    }, [routerUser, currentUser.id, db]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    useEffect(() => {
        if (!selectedUser) return;

        const interval = setInterval(async () => {
            const allMessages = await getMessagesAction(currentUser.id, selectedUser.id);
            if(allMessages.length !== messages.length) {
                setMessages(allMessages);
            }
        }, 3000); // Poll for new messages every 3 seconds

        return () => clearInterval(interval);

    }, [selectedUser, currentUser.id, messages.length]);


    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedUser) return;
        
        const newMessage = await sendMessageAction(currentUser.id, selectedUser.id, messageInput);
        setMessages(prev => [...prev, newMessage]);
        setMessageInput("");
    };

    const handleSelectConversation = async (user: User) => {
        setSelectedUser(user);
        setLoadingMessages(true);
        const allMessages = await getMessagesAction(currentUser.id, user.id);
        setMessages(allMessages);
        setLoadingMessages(false);
    }

    if (!db) return null;

    return (
        <div className="grid h-[calc(100vh-10rem)] grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col">
                 <Card className="flex-grow flex flex-col">
                    <CardHeader>
                        <CardTitle>Sohbetler</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow overflow-y-auto">
                        <div className="space-y-1">
                           {conversations.map(convoUser => (
                                <div 
                                    key={convoUser.id} 
                                    onClick={() => handleSelectConversation(convoUser)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer border-b transition-colors ${selectedUser?.id === convoUser.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={convoUser.profilePicture} alt={convoUser.displayName || convoUser.username} data-ai-hint="person face" />
                                        <AvatarFallback>{(convoUser.displayName || convoUser.username || 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold">{convoUser.displayName || convoUser.username}</p>
                                        <p className="text-sm text-muted-foreground truncate">@{convoUser.username}</p>
                                    </div>
                                </div>
                           ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 flex flex-col">
                 <Card className="h-full flex flex-col">
                    {selectedUser ? (
                        <>
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={selectedUser.profilePicture} alt={selectedUser.displayName || selectedUser.username} data-ai-hint="person face" />
                                            <AvatarFallback>{(selectedUser.displayName || selectedUser.username || 'U').charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle>{selectedUser.displayName || selectedUser.username}</CardTitle>
                                            <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow p-4 space-y-4 overflow-y-auto">
                               {loadingMessages ? (
                                 <div className="text-center">Mesajlar yükleniyor...</div>
                               ) : (
                                <>
                                  {messages.map((msg, index) => <ChatMessage key={`${msg.id}-${index}`} msg={msg} isOwnMessage={msg.senderId === currentUser.id} author={selectedUser} />)}
                                  <div ref={messagesEndRef} />
                                </>
                               )}
                            </CardContent>
                            <div className="p-4 border-t">
                                <div className="relative">
                                    <Input 
                                        placeholder="Bir mesaj yazın..." 
                                        className="pr-12"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                     />
                                    <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleSendMessage} >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <CardContent className="flex flex-col h-full items-center justify-center text-center text-muted-foreground">
                            <AlertCircle className="h-12 w-12 text-primary" />
                            <p className="text-lg font-medium mt-4">Bir sohbet seçin</p>
                            <p className="text-sm">Başlamak için soldaki sohbetlerden birini seçin.</p>
                        </CardContent>
                    )}
                 </Card>
            </div>
        </div>
    );
}

function MessagesPageLoader() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const db = useDatabase();

    useEffect(() => {
        if (!db) return;
        const init = async () => {
            const user = await db.getCurrentUser();
            setCurrentUser(user);
            setLoading(false);
        }
        init();
    }, [db]);

    if (loading || !db) {
        return (
             <div className="grid h-[calc(100vh-10rem)] grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col">
                    <Card className="flex-grow flex flex-col">
                        <CardHeader>
                            <Skeleton className="h-8 w-32" />
                        </CardHeader>
                        <CardContent className="p-0 flex-grow overflow-y-auto space-y-1">
                           {[...Array(5)].map((_, i) => (
                             <div key={i} className="flex items-center gap-3 p-3 border-b">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-grow space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                           ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 flex flex-col">
                    <Card className="h-full flex flex-col items-center justify-center">
                        <AlertCircle className="h-12 w-12 text-primary" />
                        <p className="text-lg font-medium mt-4">Sohbetler yükleniyor...</p>
                    </Card>
                </div>
             </div>
        );
    }
    
    if (!currentUser) {
        return <div className="text-center py-20">Sohbetleri görüntülemek için lütfen giriş yapın.</div>;
    }

    return <MessagesChat currentUser={currentUser} />;
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Sohbetler yükleniyor...</div>}>
            <MessagesPageLoader />
        </Suspense>
    )
}
