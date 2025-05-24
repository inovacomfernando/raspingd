
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const loginFormSchema = z.object({
  email: z.string().email({ message: "auth.validation.emailInvalid" }),
  password: z.string().min(1, { message: "auth.validation.passwordRequired" }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "fernando@example.com", // Pre-filled email
      password: "password123",      // Pre-filled password
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    await login(data.email, data.password);
    // No need to reset form here as successful login will redirect
    // If login fails, user might want to correct their input
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.form.emailLabel')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('auth.form.emailPlaceholder')} {...field} />
              </FormControl>
              <FormMessage>{form.formState.errors.email && t(form.formState.errors.email.message as string)}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.form.passwordLabel')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage>{form.formState.errors.password && t(form.formState.errors.password.message as string)}</FormMessage>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auth.login.button')}
        </Button>
      </form>
    </Form>
  );
}
