"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send, Copy, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getCurrentUser, getUserByUsername, getAllUsers } from "@/lib/data";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { usePeer } from "@/hooks/usePeer";
import type { MessagePayload } from "@/hooks/usePeer";

const ChatMessage = ({ msg, isOwnMessage, author }: { msg: MessagePayload; isOwnMessage: boolean, author?: User }) => (
  <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : ''}`}>
    {!isOwnMessage && author && (
      <Avatar className="h-8 w-8">
        <AvatarImage src={author.profilePicture} alt={author.displayName || author.username} data-ai-hint="person face" />
        <AvatarFallback>{(author.displayName || author.username || 'U').charAt(0)}</AvatarFallback>
      </Avatar>
    )}
    <div className={`max-w-xs rounded-lg px-3 py-2 ${isOwnMessage ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-secondary'}`}>
      <p>{msg.text}</p>
      <p className="text-xs text-right mt-1 opacity-70">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
);


function MessagesPageClient() {
    const searchParams = useSearchParams();
    const routerUser = searchParams.get('to');
    const { toast } = useToast();
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<User[]>([]);
    const [messageInput, setMessageInput] = useState("");
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize PeerJS hook
    const { peerId, messages, connectionStatus, connect, sendMessage } = usePeer(currentUser?.id);

    useEffect(() => {
        const init = async () => {
            const user = await getCurrentUser();
            if(!user) return;
            setCurrentUser(user);
            
            const allUsers = await getAllUsers();
            const conversationUsers = allUsers.filter(u => u.id !== user.id && u.username !== 'admin');
            setConversations(conversationUsers);
            
            if (routerUser) {
                const targetUser = await getUserByUsername(routerUser);
                if (targetUser) {
                   handleSelectConversation(targetUser);
                }
            }
        }
        init();
    }, [routerUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!messageInput.trim() || !selectedUser) return;
        sendMessage(messageInput);
        setMessageInput("");
    };

    const handleSelectConversation = (user: User) => {
        setSelectedUser(user);
        if (user.id !== connectionStatus.peerId) {
             connect(user.id);
        }
    }
    
    const copyPeerId = () => {
        if (peerId) {
            navigator.clipboard.writeText(peerId);
            toast({ title: "Peer ID Kopyalandı!", description: "ID'nizi şimdi arkadaşınızla paylaşabilirsiniz." });
        }
    }

    return (
        <div className="grid h-[calc(100vh-10rem)] grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col">
                 <Card className="flex-grow flex flex-col">
                    <CardHeader className="flex flex-col items-start justify-between gap-2">
                        <CardTitle>Sohbetler</CardTitle>
                         {peerId && (
                           <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
                               <Input value={peerId} readOnly className="flex-1 h-8 text-xs" />
                               <Button size="icon" variant="outline" className="h-8 w-8" onClick={copyPeerId}><Copy className="h-4 w-4"/></Button>
                           </div>
                         )}
                    </CardHeader>
                    <CardContent className="p-0 flex-grow overflow-y-auto">
                        <div className="space-y-1">
                           {conversations.map(convoUser => (
                                <div 
                                    key={convoUser.id} 
                                    onClick={() => handleSelectConversation(convoUser)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer border-b transition-colors ${selectedUser?.username === convoUser.username ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
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
                                    <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${connectionStatus.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        {connectionStatus.status}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow p-4 space-y-4 overflow-y-auto">
                               {messages.map((msg, index) => <ChatMessage key={`${msg.timestamp}-${index}`} msg={msg} isOwnMessage={msg.sender === peerId} author={selectedUser} />)}
                               <div ref={messagesEndRef} />
                            </CardContent>
                            <div className="p-4 border-t">
                                <div className="relative">
                                    <Input 
                                        placeholder="Bir mesaj yazın..." 
                                        className="pr-12"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={connectionStatus.status !== 'connected'}
                                     />
                                    <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleSendMessage} disabled={connectionStatus.status !== 'connected'}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <CardContent className="flex flex-col h-full items-center justify-center text-center text-muted-foreground">
                            <AlertCircle className="h-12 w-12 text-primary" />
                            <p className="text-lg font-medium">Bir sohbet seçin</p>
                            <p className="text-sm">Başlamak için soldaki sohbetlerden birini seçin.</p>
                        </CardContent>
                    )}
                 </Card>
            </div>
        </div>
    );
}


export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Sohbetler yükleniyor...</div>}>
            <MessagesPageClient />
        </Suspense>
    )
}
