"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Share2, Copy } from "lucide-react"
import type { Video, Post } from "@/lib/types"

interface ShareDialogProps {
  content: Video | Post;
}

export function ShareDialog({ content }: ShareDialogProps) {
    const { toast } = useToast();
    const [pageUrl, setPageUrl] = React.useState("");

    React.useEffect(() => {
        // Ensure this runs only on the client
        if (typeof window !== "undefined") {
            setPageUrl(window.location.href);
        }
    }, []);

    const isVideo = 'videoUrl' in content;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "Kopyalandı!",
                description: `${label} panoya kopyalandı.`,
            });
        }).catch(err => {
            console.error('Kopyalanamadı', err);
            toast({
                title: "Hata",
                description: "Pano'ya kopyalanamadı.",
                variant: "destructive"
            });
        });
    };

    const embedCode = isVideo ? `<iframe src="${pageUrl}" width="560" height="315" title="${content.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="rounded-full gap-2">
                    <Share2 className="h-5 w-5" /> Paylaş
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Paylaş</DialogTitle>
                    <DialogDescription>
                        Bu içeriği paylaşmak için aşağıdaki bağlantılardan birini kopyalayın.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="page-url">Sayfa Linki</Label>
                        <div className="flex gap-2">
                            <Input id="page-url" value={pageUrl} readOnly />
                            <Button size="icon" className="shrink-0" onClick={() => copyToClipboard(pageUrl, "Sayfa linki")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {isVideo && embedCode && (
                        <div className="space-y-2">
                            <Label htmlFor="embed-code">Gömme Kodu</Label>
                             <div className="flex gap-2">
                                <Input id="embed-code" value={embedCode} readOnly />
                                <Button size="icon" className="shrink-0" onClick={() => copyToClipboard(embedCode, "Gömme kodu")}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {isVideo && (
                        <div className="space-y-2">
                            <Label htmlFor="video-url">Video Linki</Label>
                             <div className="flex gap-2">
                                <Input id="video-url" value={(content as Video).videoUrl} readOnly />
                                <Button size="icon" className="shrink-0" onClick={() => copyToClipboard((content as Video).videoUrl, "Video linki")}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
