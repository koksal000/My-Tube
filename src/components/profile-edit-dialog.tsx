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
import { getUserByUsername, updateUser } from "@/lib/db"

interface EditProfileDialogProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export function EditProfileDialog({ user, onProfileUpdate }: EditProfileDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = React.useState(false);
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
        }
    }, [isOpen, user]);

    const handleSaveChanges = async () => {
        if (username !== user.username) {
            const existingUser = await getUserByUsername(username);
            if (existingUser) {
                toast({
                    title: "Username taken",
                    description: "This username is already in use. Please choose another one.",
                    variant: "destructive",
                });
                return;
            }
        }

        let profilePictureBase64: string = user.profilePicture;
        if (newProfilePicture) {
            profilePictureBase64 = await toBase64(newProfilePicture);
        }

        let bannerBase64: string | undefined = user.banner;
        if (removeBanner) {
            bannerBase64 = undefined;
        } else if (newBanner) {
            bannerBase64 = await toBase64(newBanner);
        }
        
        const updatedUser: User = {
            ...user,
            username,
            displayName,
            about,
            profilePicture: profilePictureBase64,
            banner: bannerBase64,
        };

        await updateUser(updatedUser);

        onProfileUpdate(updatedUser);
        
        toast({
            title: "Profile Updated",
            description: "Your profile information has been successfully updated.",
        });
        
        setIsOpen(false);
    };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="rounded-full">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="displayName" className="text-right">
              Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="about" className="text-right">
              About
            </Label>
            <Textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="col-span-3"
              placeholder="Tell everyone about your channel."
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profile-picture" className="text-right">
              Profile Picture
            </Label>
            <Input
              id="profile-picture"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && setNewProfilePicture(e.target.files[0])}
              className="col-span-3"
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
              disabled={removeBanner}
              onChange={(e) => e.target.files && setNewBanner(e.target.files[0])}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="remove-banner" className="text-right">
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
                <Checkbox id="remove-banner" checked={removeBanner} onCheckedChange={(checked) => setRemoveBanner(checked as boolean)} />
                <label htmlFor="remove-banner" className="text-sm font-medium leading-none">Remove banner</label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="ghost">Cancel</Button>
          <Button type="button" onClick={handleSaveChanges}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
