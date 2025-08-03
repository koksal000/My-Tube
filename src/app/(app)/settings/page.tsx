"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

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

export default function SettingsPage() {
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [showGifs, setShowGifs] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setInAppNotifications(getSettingFromStorage('myTube-inAppNotifications', true));
    setAutoplay(getSettingFromStorage('myTube-autoplay', true));
    setShowGifs(getSettingFromStorage('myTube-showGifs', true));
  }, []);

  const handleSettingChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, key: string) => (checked: boolean) => {
    setter(checked);
    setSettingInStorage(key, checked);
  };
  
  if (!isMounted) {
    return null; // or a loading skeleton
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ayarlar</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tercihler</CardTitle>
          <CardDescription>Uygulama ayarlarınızı yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notifications" className="flex flex-col space-y-1">
                    <span>Uygulama İçi Bildirimler</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Yeni içerikler ve yanıtlar hakkında bildirim alın.
                    </span>
                </Label>
                <Switch 
                  id="notifications" 
                  checked={inAppNotifications}
                  onCheckedChange={handleSettingChange(setInAppNotifications, 'myTube-inAppNotifications')}
                />
            </div>
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="autoplay" className="flex flex-col space-y-1">
                    <span>Otomatik Oynatma</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Bir sonraki videoyu otomatik olarak oynatın.
                    </span>
                </Label>
                <Switch 
                  id="autoplay" 
                  checked={autoplay} 
                  onCheckedChange={handleSettingChange(setAutoplay, 'myTube-autoplay')}
                />
            </div>
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-gifs" className="flex flex-col space-y-1">
                    <span>Yorumlarda GIF'leri göster</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Bunu devre dışı bırakmak performansı artırabilir.
                    </span>
                </Label>
                <Switch 
                  id="show-gifs" 
                  checked={showGifs} 
                  onCheckedChange={handleSettingChange(setShowGifs, 'myTube-showGifs')} 
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
