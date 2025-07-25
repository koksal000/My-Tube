
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadVideoForm } from "@/components/upload/upload-video-form"
import { UploadPostForm } from "@/components/upload/upload-post-form"

export default function UploadPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="video" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="video">Upload Video</TabsTrigger>
                    <TabsTrigger value="post">Create Post</TabsTrigger>
                </TabsList>
                <TabsContent value="video">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload a new video</CardTitle>
                            <CardDescription>
                                Share your latest creation with the community. Please provide a title, description, and the video file.
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
                            <CardTitle>Create a new post</CardTitle>
                            <CardDescription>
                                Share an image and a caption with your followers.
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
