"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Örnek sohbet verisi
const conversations = [
  { id: 1, name: "Gezgin Kamera", message: "Harika bir video, tebrikler!", avatar: "https://i.pravatar.cc/150?u=user2" },
  { id: 2, name: "Müzik Ruhu", message: "Yeni cover ne zaman geliyor?", avatar: "https://i.pravatar.cc/150?u=user3" },
  { id: 3, name: "Teknoloji Gurusu", message: "İncelemeni bekliyorum.", avatar: "https://i.pravatar.cc/150?u=user4" },
]


export default function MessagesPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Sohbetler</CardTitle>
                        <Button variant="ghost" size="sm">Yeni Mesaj</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-1">
                           {conversations.map(convo => (
                                <div key={convo.id} className="flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer border-b">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={convo.avatar} alt={convo.name} data-ai-hint="person face" />
                                        <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{convo.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{convo.message}</p>
                                    </div>
                                </div>
                           ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                 <Card className="h-full">
                    <CardContent>
                        <div className="flex flex-col h-[calc(100vh-14rem)] items-center justify-center text-center text-muted-foreground">
                            <p className="text-lg font-medium">Bir sohbet seçin</p>
                            <p className="text-sm">Başlamak için soldaki sohbetlerden birini seçin.</p>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}

    