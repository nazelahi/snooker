

"use client";

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { getFromStorage, saveToStorage } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubName, setClubName] = useState("CueScore");

  useEffect(() => {
    const storedSettings = getFromStorage('siteSettings', { name: 'CueScore' });
    setClubName(storedSettings.name);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email and password.",
      });
      return;
    }
    
    const adminEmail = "admin@gmail.com";
    const adminPassword = "123456";

    if (email === adminEmail && password === adminPassword) {
        toast({
            title: "Success!",
            description: "Admin logged in successfully.",
        });
        saveToStorage('userData', { name: 'Admin', email: adminEmail, isAdmin: true });
        window.dispatchEvent(new Event('storage'));
        router.push('/admin');
        return;
    }

    const storedUsers = getFromStorage<{name: string, email: string, password: string}[]>('users', []);
    const user = storedUsers.find(u => u.email === email && u.password === password);

    if (user) {
      toast({
        title: "Success!",
        description: "You have been logged in.",
      });
      saveToStorage('userData', { name: user.name, email: user.email, isAdmin: false });
      window.dispatchEvent(new Event('storage'));
      router.push('/my-stats');
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader className="text-center">
            <Icons.logo className="h-12 w-12 mx-auto text-primary" />
            <CardTitle className="text-2xl mt-4">Welcome to {clubName}</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
                <Button variant="outline" className="w-full" type="button">
                  Login with Google
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
