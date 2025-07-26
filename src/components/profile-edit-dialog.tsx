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
    const [newBanner, setNewBanner] = React.useState<File | null>(null);

    const handleSaveChanges = async () => {
        const storedUsers = localStorage.getItem("myTubeUsers");
        const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];

        // Check if new username is already taken by someone else
        if (username !== user.username && allUsers.some(u => u.username === username)) {
            toast({
                title: "Username taken",
                description: "This username is already in use. Please choose another one.",
                variant: "destructive",
            });
            return;
        }

        let bannerBase64: string | undefined = user.banner;
        if (newBanner) {
            bannerBase64 = await toBase64(newBanner);
        }
        
        const updatedUser = {
            ...user,
            username,
            displayName,
            banner: bannerBase64,
        };

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
            <Label htmlFor="banner" className="text-right">
              Banner
            </Label>
            <Input
              id="banner"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && setNewBanner(e.target.files[0])}
              className="col-span-3"
            />
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
