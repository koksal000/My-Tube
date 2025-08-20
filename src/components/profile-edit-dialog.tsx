"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import { getUserByUsername, updateUser } from "@/lib/data"
import { uploadFileAction } from "@/app/actions"

interface EditProfileDialogProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('fileToUpload', file);
    return await uploadFileAction(formData);
}


export function EditProfileDialog({ user, onProfileUpdate }: EditProfileDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [username, setUsername] = React.useState(user.username);
    const [displayName, setDisplayName] = React.useState(user.displayName);
    const [about, setAbout] = React.useState(user.about || "");
    const [newProfilePicture, setNewProfilePicture] = React.useState<File | null>(null);
    const [newBanner, setNewBanner] = React.useState<File | null>(null);
    const [removeBanner, setRemoveBanner] = React.useState(!user.banner);

    React.useEffect(() => {
        if (isOpen) {
            setUsername(user.username);
            setDisplayName(user.displayName);
            setAbout(user.about || "");
            setRemoveBanner(!user.banner);
            setNewProfilePicture(null);
            setNewBanner(null);
            setIsSaving(false);
        }
    }, [isOpen, user]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        if (username !== user.username) {
            const existingUser = await getUserByUsername(username);
            if (existingUser) {
                toast({
                    title: "Kullanıcı adı alınmış",
                    description: "Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir tane seçin.",
                    variant: "destructive",
                });
                setIsSaving(false);
                return;
            }
        }
        
        try {
            let profilePictureUrl: string = user.profilePicture;
            if (newProfilePicture) {
                profilePictureUrl = await uploadFile(newProfilePicture);
            }

            let bannerUrl: string | undefined = user.banner;
            if (removeBanner) {
                bannerUrl = undefined;
            } else if (newBanner) {
                bannerUrl = await uploadFile(newBanner);
            }
            
            const updatedUser: User = {
                ...user,
                username,
                displayName,
                about,
                profilePicture: profilePictureUrl,
                banner: bannerUrl,
            };

            await updateUser(updatedUser);

            onProfileUpdate(updatedUser);
            
            toast({
                title: "Profil Güncellendi",
                description: "Profil bilgileriniz başarıyla güncellendi.",
            });
            
            setIsOpen(false);

        } catch (error) {
            console.error("Profile update failed", error);
            toast({ title: "Güncelleme Başarısız", description: `Bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen Hata'}`, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="rounded-full">Profili Düzenle</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profili düzenle</DialogTitle>
          <DialogDescription>
            Profilinizde değişiklik yapın. Bittiğinde kaydet'e tıklayın.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="displayName" className="text-right">
              Görünen Ad
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="col-span-3"
              disabled={isSaving}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Kullanıcı Adı
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              disabled={isSaving}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="about" className="text-right">
              Hakkında
            </Label>
            <Textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="col-span-3"
              placeholder="Kanalınız hakkında bilgi verin."
              disabled={isSaving}
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profile-picture" className="text-right">
              Profil Resmi
            </Label>
            <Input
              id="profile-picture"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && setNewProfilePicture(e.target.files[0])}
              className="col-span-3"
              disabled={isSaving}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="banner" className="text-right">
              Banner
            </Label>
            <Input
              id="banner"
              type="file"
              accept="image/*"
              disabled={removeBanner || isSaving}
              onChange={(e) => e.target.files && setNewBanner(e.target.files[0])}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="remove-banner" className="text-right">
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
                <Checkbox id="remove-banner" checked={removeBanner} onCheckedChange={(checked) => setRemoveBanner(checked as boolean)} disabled={isSaving} />
                <label htmlFor="remove-banner" className="text-sm font-medium leading-none">Banner'ı kaldır</label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="ghost" disabled={isSaving}>İptal</Button>
          <Button type="button" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
