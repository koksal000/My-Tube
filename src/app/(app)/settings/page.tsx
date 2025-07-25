import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your application settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Receive notifications about new content and replies.
                    </span>
                </Label>
                <Switch id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="autoplay" className="flex flex-col space-y-1">
                    <span>Autoplay</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Automatically play the next video.
                    </span>
                </Label>
                <Switch id="autoplay" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-gifs" className="flex flex-col space-y-1">
                    <span>Show GIFs in comments</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Disabling this can improve performance.
                    </span>
                </Label>
                <Switch id="show-gifs" defaultChecked />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
