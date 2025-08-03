"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getCurrentUser, getUserByUsername, getAllUsers } from "@/lib/data";
import type { User } from "@/lib/types";

const ChatMessage = ({ msg, isOwnMessage }: { msg: any; isOwnMessage: boolean }) => (
  <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : ''}`}>
    {!isOwnMessage && (
      <Avatar className="h-8 w-8">
        <AvatarImage src={msg.avatar} alt={msg.name} data-ai-hint="person face" />
        <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
      </Avatar>
    )}
    <div className={`max-w-xs rounded-lg px-3 py-2 ${isOwnMessage ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-secondary'}`}>
      <p>{msg.text}</p>
    </div>
  </div>
);

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const routerUser = searchParams.get('to');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<User[]>([]);

    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);

        const allUsers = getAllUsers();
        if(user) {
            const conversationUsers = allUsers.filter(u => u.id !== user.id && u.username !== 'admin');
            setConversations(conversationUsers);
            
            if (routerUser) {
                const targetUser = getUserByUsername(routerUser);
                if (targetUser) {
                    setSelectedUser(targetUser);
                }
            } else if (conversationUsers.length > 0) {
                // Select the first user in the list if no specific user is targeted
                setSelectedUser(conversationUsers[0]);
            }
        }
    }, [routerUser]);


    const messages = selectedUser ? [
        { id: 1, name: selectedUser.displayName, avatar: selectedUser.profilePicture, text: "Selam! Son videon harikaydı, tebrik ederim. 😊" },
        { id: 2, isOwnMessage: true, text: "Çok teşekkür ederim! Beğenmene sevindim." },
    ] : [];

    return (
        <div className="grid h-[calc(100vh-10rem)] grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col">
                 <Card className="flex-grow flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Sohbetler</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow overflow-y-auto">
                        <div className="space-y-1">
                           {conversations.map(convoUser => (
                                <div 
                                    key={convoUser.id} 
                                    onClick={() => setSelectedUser(convoUser)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer border-b transition-colors ${selectedUser?.username === convoUser.username ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={convoUser.profilePicture} alt={convoUser.displayName} data-ai-hint="person face" />
                                        <AvatarFallback>{convoUser.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold">{convoUser.displayName}</p>
                                        <p className="text-sm text-muted-foreground truncate">Harika bir video, tebrikler!</p>
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
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedUser.profilePicture} alt={selectedUser.displayName} data-ai-hint="person face" />
                                        <AvatarFallback>{selectedUser.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle>{selectedUser.displayName}</CardTitle>
                                        <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow p-4 space-y-4 overflow-y-auto">
                               {messages.map(msg => <ChatMessage key={msg.id} msg={msg} isOwnMessage={!!msg.isOwnMessage} />)}
                            </CardContent>
                            <div className="p-4 border-t">
                                <div className="relative">
                                    <Input placeholder="Bir mesaj yazın..." className="pr-12" />
                                    <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <CardContent className="flex flex-col h-full items-center justify-center text-center text-muted-foreground">
                            <p className="text-lg font-medium">Bir sohbet seçin</p>
                            <p className="text-sm">Başlamak için soldaki sohbetlerden birini seçin.</p>
                        </CardContent>
                    )}
                 </Card>
            </div>
        </div>
    );
}
