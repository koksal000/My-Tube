import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
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
                    <span>E-posta Bildirimleri</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Yeni içerikler ve yanıtlar hakkında bildirim alın.
                    </span>
                </Label>
                <Switch id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="autoplay" className="flex flex-col space-y-1">
                    <span>Otomatik Oynatma</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Bir sonraki videoyu otomatik olarak oynatın.
                    </span>
                </Label>
                <Switch id="autoplay" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-gifs" className="flex flex-col space-y-1">
                    <span>Yorumlarda GIF'leri göster</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Bunu devre dışı bırakmak performansı artırabilir.
                    </span>
                </Label>
                <Switch id="show-gifs" defaultChecked />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
