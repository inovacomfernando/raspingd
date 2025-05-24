
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, User, Briefcase, Image as ImageIcon, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { v4 as uuidv4 } from 'uuid';
import type { TeamMember } from "@/types/team-member";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import NextImage from "next/image";

const LOCAL_STORAGE_TEAM_MEMBERS_KEY = "teamMembersApp_members";

export default function TeamPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  const [currentName, setCurrentName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState("");

  const loadMembers = useCallback(() => {
    setIsLoadingMembers(true);
    let loadedMembers: TeamMember[] = [];
    try {
      const storedMembersJson = localStorage.getItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY);
      if (storedMembersJson) {
        const parsedMembers = JSON.parse(storedMembersJson);
        if (Array.isArray(parsedMembers)) {
          loadedMembers = parsedMembers;
        } else {
          console.warn(`${LOCAL_STORAGE_TEAM_MEMBERS_KEY} in localStorage is not an array. Resetting.`);
          localStorage.setItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY, JSON.stringify([]));
          loadedMembers = [];
        }
      } else {
        // Key doesn't exist, initialize it
        localStorage.setItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY, JSON.stringify([]));
        loadedMembers = [];
      }
    } catch (error) {
      console.error(`Error parsing ${LOCAL_STORAGE_TEAM_MEMBERS_KEY} from localStorage. Resetting.`, error);
      localStorage.setItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY, JSON.stringify([]));
      loadedMembers = [];
    }
    setMembers([...loadedMembers]); // Ensure new array reference
    setIsLoadingMembers(false);
  }, []);

  useEffect(() => {
    setIsClient(true); 
    loadMembers();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_TEAM_MEMBERS_KEY) {
        loadMembers();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadMembers]);

  const saveMembersToLocalStorage = useCallback((updatedMembers: TeamMember[]) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY, JSON.stringify(updatedMembers));
        setMembers([...updatedMembers]); // Ensure new array reference for re-render
    } catch (error) {
        console.error("Failed to save team members to localStorage:", error);
        toast({
            title: t('teamPage.toast.saveErrorTitle', {context: "localStorage"}), // Example of using context
            description: t('teamPage.toast.saveErrorDesc'),
            variant: "destructive"
        });
    }
  }, [toast, t]);

  const handleOpenAddDialog = () => {
    setEditingMember(null);
    setCurrentName("");
    setCurrentRole("");
    setCurrentAvatarUrl("https://placehold.co/100x100.png");
    setShowAddEditDialog(true);
  };

  const handleOpenEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setCurrentName(member.name);
    setCurrentRole(member.role);
    setCurrentAvatarUrl(member.avatarUrl);
    setShowAddEditDialog(true);
  };

  const handleSaveMember = () => {
    if (!currentName.trim() || !currentRole.trim()) {
      toast({
        title: t('teamPage.error.incompleteTitle'),
        description: t('teamPage.error.incompleteDescription'),
        variant: "destructive",
      });
      return;
    }
    setIsSavingMember(true);

    let updatedMembers: TeamMember[];
    if (editingMember) {
      updatedMembers = members.map(m =>
        m.id === editingMember.id ? { ...m, name: currentName, role: currentRole, avatarUrl: currentAvatarUrl } : m
      );
      toast({ title: t('teamPage.toast.memberUpdatedTitle'), description: t('teamPage.toast.memberUpdatedDesc', { name: currentName }) });
    } else {
      const newMember: TeamMember = {
        id: uuidv4(),
        name: currentName,
        role: currentRole,
        avatarUrl: currentAvatarUrl || 'https://placehold.co/100x100.png',
      };
      updatedMembers = [...members, newMember];
      toast({ title: t('teamPage.toast.memberAddedTitle'), description: t('teamPage.toast.memberAddedDesc', { name: newMember.name }) });
    }
    saveMembersToLocalStorage(updatedMembers);

    setIsSavingMember(false);
    setShowAddEditDialog(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId: string) => {
    const memberToDelete = members.find(m => m.id === memberId);
    const updatedMembers = members.filter(m => m.id !== memberId);
    saveMembersToLocalStorage(updatedMembers);
    toast({ title: t('teamPage.toast.memberDeletedTitle'), description: t('teamPage.toast.memberDeletedDesc', { name: memberToDelete?.name || '' }) });
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (!isClient || isLoadingMembers) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('teamPage.title')}</CardTitle>
            <CardDescription>{t('teamPage.loadingDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('teamPage.title')}</CardTitle>
            <CardDescription>{t('teamPage.description')}</CardDescription>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('teamPage.addMemberButton')}
          </Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg text-center bg-muted/20">
              <NextImage 
                src="https://placehold.co/400x300.png" 
                alt={t('teamPage.noMembersAlt')}
                width={400}
                height={300} 
                className="mb-6 rounded-md opacity-70"
                data-ai-hint="team group"
              />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {t('teamPage.noMembersTitle')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {t('teamPage.noMembersDescription')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {members.map(member => (
                <Card key={member.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.name.includes(" ") ? member.name.split(" ")[0] : member.name}/>
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-end space-x-2 pt-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(member)} className="text-muted-foreground hover:text-foreground">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive-hover">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('teamPage.deleteDialog.title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('teamPage.deleteDialog.description', { name: member.name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('teamPage.deleteDialog.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMember(member.id)} className="bg-destructive hover:bg-destructive/90">
                            {t('teamPage.deleteDialog.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMember ? t('teamPage.editMemberDialog.title') : t('teamPage.addMemberDialog.title')}</DialogTitle>
            <DialogDescription>
              {editingMember ? t('teamPage.editMemberDialog.description') : t('teamPage.addMemberDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right col-span-1">
                {t('teamPage.form.nameLabel')}
              </Label>
              <Input
                id="name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className="col-span-3"
                placeholder={t('teamPage.form.namePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right col-span-1">
                {t('teamPage.form.roleLabel')}
              </Label>
              <Input
                id="role"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="col-span-3"
                placeholder={t('teamPage.form.rolePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="avatarUrl" className="text-right col-span-1">
                {t('teamPage.form.avatarUrlLabel')}
              </Label>
              <Input
                id="avatarUrl"
                value={currentAvatarUrl}
                onChange={(e) => setCurrentAvatarUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://placehold.co/100x100.png"
              />
            </div>
            {currentAvatarUrl && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-start-2 col-span-3">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={currentAvatarUrl} alt={currentName || "Avatar Preview"} data-ai-hint="person face"/>
                            <AvatarFallback>{currentName ? getInitials(currentName) : <User />}</AvatarFallback>
                        </Avatar>
                    </div>
                 </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={() => {setShowAddEditDialog(false); setEditingMember(null);}}>
                    {t('teamPage.form.cancelButton')}
                </Button>
            </DialogClose>
            <Button onClick={handleSaveMember} disabled={isSavingMember}>
              {isSavingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingMember ? t('teamPage.form.saveChangesButton') : t('teamPage.form.addMemberButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

