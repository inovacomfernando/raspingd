
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


const AuthPageLogo = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="hsl(var(--primary))" strokeWidth="1.5">
      <path d="M10.5 13.5L15.5 8.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 8.5L15.5 13.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 18L21 21" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

export default function AuthPage() {
  const { t, currentLanguage, setLanguage } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4 relative">
        <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
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
        </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
            <Link href="/" className="mb-2">
                <AuthPageLogo />
            </Link>
          <CardTitle className="text-2xl font-bold">
            {t('auth.welcome.title', { appName: 'RaspingD' })}
          </CardTitle>
          <CardDescription>
            {t('auth.welcome.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
 <LoginForm />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RaspingD. {t('auth.footer.allRightsReserved')}
      </p>
    </div>
  );
}
