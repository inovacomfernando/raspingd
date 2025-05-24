
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

const signupFormSchema = z.object({
  name: z.string().min(2, { message: "auth.validation.nameMinLength" }),
  email: z.string().email({ message: "auth.validation.emailInvalid" }),
  password: z.string().min(6, { message: "auth.validation.passwordMinLength" }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm() {
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    const success = await signup(data.name, data.email, data.password);
    if (success) {
      // Redirect is handled by AuthContext
    } else {
        // Reset form only on signup failure to allow re-attempt
        // For example, if email already exists
         form.reset({ name: data.name, email: "", password: "" }); // Keep name, clear email/pass
    }
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.form.nameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('auth.form.namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage>{form.formState.errors.name && t(form.formState.errors.name.message as string)}</FormMessage>
            </FormItem>
          )}
        />
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
                <Input type="password" placeholder={t('auth.form.passwordPlaceholder')} {...field} />
              </FormControl>
              <FormMessage>{form.formState.errors.password && t(form.formState.errors.password.message as string)}</FormMessage>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auth.signup.button')}
        </Button>
      </form>
    </Form>
  );
}
