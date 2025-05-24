
"use client";

import * as React from "react";
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Bell, Globe, Mail, Search, Download, Smartphone, LogOutIcon, User as UserIcon } from "lucide-react"; // Added UserIcon for avatar change
import { SidebarNav } from "./sidebar-nav";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";


const RaspingDIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5">
    <path d="M10.5 13.5L15.5 8.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 8.5L15.5 13.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 18L21 21" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { currentUser, logout, isLoading: isAuthLoading, updateUserAvatar } = useAuth();
  const pathname = usePathname();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        toast({
          title: t('auth.avatarUpdate.errorSizeTitle'),
          description: t('auth.avatarUpdate.errorSizeDesc'),
          variant: 'destructive',
        });
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateUserAvatar(base64String);
      };
      reader.readAsDataURL(file);
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input after processing
    }
  };


  if (pathname === '/auth') {
    return <main className="flex-1 overflow-auto p-0 bg-background">{children}</main>;
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <RaspingDIcon />
            <Skeleton className="h-8 w-48" />
            <p className="text-muted-foreground">{t('app.loading')}</p>
        </div>
      </div>
    );
  }


  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" asChild>
              <Link href="/">
                <RaspingDIcon />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold tracking-tight text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              Rasping<span style={{ color: 'hsl(var(--accent))' }}>D</span>
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2 pr-0">
           <p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('nav.menu')}</p>
          <SidebarMenu>
            <SidebarNav />
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto">
          <Card className="bg-gradient-to-br from-primary to-green-700 text-primary-foreground shadow-lg overflow-hidden">
            <div className="p-3 pb-1">
                <div className="bg-white/20 rounded-full p-1.5 w-fit">
                    <Smartphone className="h-5 w-5 text-white" />
                </div>
            </div>
            <CardContent className="p-3 pt-0">
              <p className="text-sm font-semibold mb-1">{t('nav.downloadApp.title')}</p>
              <p className="text-xs opacity-80 mb-2">{t('nav.downloadApp.description')}</p>
              <Button variant="secondary" size="sm" className="w-full bg-white text-primary hover:bg-white/90">
                <Download className="mr-2 h-4 w-4" />
                {t('nav.downloadApp.button')}
              </Button>
            </CardContent>
          </Card>
          <Separator className="my-3 bg-sidebar-border" />
           <p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('nav.general')}</p>
          <SidebarMenu>
            <Link href="#" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <Settings className="h-5 w-5" />
                    {t('nav.settings')}
                </Button>
            </Link>
             <Link href="#" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <Globe className="h-5 w-5" />
                    {t('nav.help')}
                </Button>
            </Link>
            <Button onClick={logout} variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <LogOutIcon className="h-5 w-5" />
                {t('nav.logout')}
            </Button>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <SidebarTrigger className="sm:hidden" />
          <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('header.searchPlaceholder')}
              className="w-full rounded-lg bg-card pl-8 md:w-[280px] lg:w-[320px] shadow-sm"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">{t('language.selector.label')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('language.selector.label')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLanguage('en')}
                  disabled={currentLanguage === 'en'}
                >
                  {t('language.en')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage('pt')}
                  disabled={currentLanguage === 'pt'}
                >
                  {t('language.pt')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" className="rounded-full">
              <Mail className="h-5 w-5" />
              <span className="sr-only">{t('header.messages')}</span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">{t('header.notifications')}</span>
            </Button>
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={currentUser.avatarUrl || `https://placehold.co/100x100.png/77D3D0/FFFFFF?text=${currentUser.name.substring(0,2).toUpperCase()}`}
                        alt={currentUser.name}
                        data-ai-hint="person face"
                      />
                      <AvatarFallback>{currentUser.name.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      {t('header.changeAvatar')}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('header.profile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('nav.settings')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          {children}
        </main>
        <input
         type="file"
         ref={fileInputRef}
         onChange={handleFileChange}
         accept="image/png, image/jpeg, image/gif"
         style={{ display: 'none' }}
       />
      </SidebarInset>
    </SidebarProvider>
  );
}
