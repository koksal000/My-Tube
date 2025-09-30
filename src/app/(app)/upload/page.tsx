
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadVideoForm } from "@/components/upload/upload-video-form"
import { UploadPostForm } from "@/components/upload/upload-post-form"
import { useDatabase } from "@/lib/db-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function UploadPage() {
    const db = useDatabase();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (db) {
            const checkUser = async () => {
                const user = await db.getCurrentUser();
                if (!user) {
                    router.push('/login');
                } else {
                    setIsReady(true);
                }
            };
            checkUser();
        }
    }, [db, router]);

    if (!isReady) {
        return <div className="text-center py-20">Yükleniyor...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="video" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="video">Video Yükle</TabsTrigger>
                    <TabsTrigger value="post">Gönderi Oluştur</TabsTrigger>
                </TabsList>
                <TabsContent value="video">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yeni bir video yükle</CardTitle>
                            <CardDescription>
                                En son eserinizi toplulukla paylaşın. Lütfen bir başlık, açıklama ve video dosyası sağlayın.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <UploadVideoForm />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="post">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yeni bir gönderi oluştur</CardTitle>
                            <CardDescription>
                                Takipçilerinizle bir resim ve bir başlık paylaşın.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <UploadPostForm />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
