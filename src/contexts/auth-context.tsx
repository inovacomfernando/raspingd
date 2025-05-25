
"use client";

import type { User, StoredUser } from '@/types/user';
import { useRouter, usePathname } from 'next/navigation';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';

const LOCAL_STORAGE_USERS_KEY = "marketwiseApp_users";
const LOCAL_STORAGE_SESSION_KEY = "marketwiseApp_session";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUserAvatar: (avatarUrl: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// IMPORTANT: This is a basic simulation.
// In a real app, NEVER store passwords in plain text or use such simple "hashing".
// Use proper password hashing (e.g., bcrypt, Argon2) on a backend server.
const pseudoHash = (password: string) => `simulated_${password}_hash`;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { t } = useTranslation();

  const initializeAuth = useCallback(() => {
    setIsLoading(true);
    let storedUsers: StoredUser[] = [];
    const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (usersJson) {
      storedUsers = JSON.parse(usersJson);
    }

    if (storedUsers.length === 0) {
      // Create default user "Fernando Ramalho"
      const fernando: StoredUser = {
        id: uuidv4(),
        name: "Fernando Ramalho",
        email: "fernando@example.com",
        passwordHash: pseudoHash("password123"),
        avatarUrl: undefined, // Initialize avatarUrl
      };
      storedUsers.push(fernando);
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(storedUsers));
      console.log("Default user 'Fernando Ramalho' created. Email: fernando@example.com, Pass: password123");
    }

    const sessionJson = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (sessionJson) {
      const sessionUser = JSON.parse(sessionJson) as User;
      // Verify if this user still exists in our "database"
      const userInDb = storedUsers.find(u => u.id === sessionUser.id && u.email === sessionUser.email);
      if (userInDb) {
        // Ensure sessionUser has avatarUrl from the "DB" if it was updated elsewhere
        setCurrentUser({ ...sessionUser, avatarUrl: userInDb.avatarUrl });
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY); // Clean up invalid session
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ['/auth'];
    const pathIsPublic = publicPaths.includes(pathname);

    if (!currentUser && !pathIsPublic) {
      router.push('/auth');
    } else if (currentUser && pathIsPublic) {
      router.push('/');
    }
  }, [currentUser, isLoading, pathname, router]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!usersJson) {
      toast({ title: t('auth.login.error.noUsersTitle'), description: t('auth.login.error.noUsersDesc'), variant: "destructive" });
      return false;
    }
    const storedUsers: StoredUser[] = JSON.parse(usersJson);
    const user = storedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user && user.passwordHash === pseudoHash(pass)) {
      const sessionUser: User = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl };
      setCurrentUser(sessionUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessionUser));
      return true;
    }
    toast({ title: t('auth.login.error.invalidCredentialsTitle'), description: t('auth.login.error.invalidCredentialsDesc'), variant: "destructive" });
    return false;
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    let storedUsers: StoredUser[] = [];
    const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (usersJson) {
      storedUsers = JSON.parse(usersJson);
    }

    if (storedUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      toast({ title: t('auth.signup.error.emailExistsTitle'), description: t('auth.signup.error.emailExistsDesc'), variant: "destructive" });
      return false;
    }

    const newUser: StoredUser = {
      id: uuidv4(),
      name,
      email,
      passwordHash: pseudoHash(pass),
      avatarUrl: undefined, // Initialize avatarUrl
    };
    storedUsers.push(newUser);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(storedUsers));

    const sessionUser: User = { id: newUser.id, name: newUser.name, email: newUser.email, avatarUrl: newUser.avatarUrl };
    setCurrentUser(sessionUser);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessionUser));
    return true;
  };

  const updateUserAvatar = async (avatarUrl: string): Promise<boolean> => {
    if (!currentUser) return false;

    const updatedCurrentUser = { ...currentUser, avatarUrl };
    setCurrentUser(updatedCurrentUser);

    const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    let storedUsers: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
    storedUsers = storedUsers.map(u =>
      u.id === currentUser.id ? { ...u, avatarUrl } : u
    );
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(storedUsers));
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedCurrentUser));

    toast({ title: t('auth.avatarUpdate.successTitle'), description: t('auth.avatarUpdate.successDesc') });
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    toast({ title: t('auth.logout.successTitle') });
  };

  if (isLoading && !['/auth'].includes(pathname)) {
     // Basic loading state to prevent flashing content if not on auth page
    return <div className="flex h-screen items-center justify-center"><p>Loading application...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, signup, logout, updateUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
