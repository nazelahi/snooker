
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
import { getFromStorage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubName, setClubName] = useState("CueScore");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedSettings = getFromStorage('siteSettings', { name: 'CueScore' });
    setClubName(storedSettings.name);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email and password.",
      });
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
       toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } else if (data.user) {
        toast({
            title: "Success!",
            description: "You have been logged in.",
        });
        
        // This will trigger the auth listener in RootLayout
        // which will then trigger a storage event for components to update
        router.push('/');
    }
    setLoading(false);
  };
  
   const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not log in with Google. ' + error.message,
      });
      setLoading(false);
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
                <Button variant="outline" className="w-full" type="button" onClick={handleGoogleLogin} disabled={loading}>
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
