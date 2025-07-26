
"use client";

import Link from "next/link";
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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SiteLogo } from '@/components/site-logo';

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubName, setClubName] = useState("CueScore");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchSiteName = async () => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'siteSettings').single();
        if (data?.value.name) {
            setClubName(data.value.name);
        }
    };
    fetchSiteName();
  }, [supabase]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!name || !email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      setLoading(false);
      return;
    }

    // With email confirmation disabled in Supabase, this will
    // create the user and log them in directly.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) {
       toast({
        variant: "destructive",
        title: "Signup Failed",
        description: signUpError.message,
      });
       setLoading(false);
       return;
    }

    // The 'handle_new_user' trigger in the database will create the player profile.
    // If signup is successful and email confirmation is off, the user is already logged in.
    if (signUpData.user) {
        toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
        });
        // Since the user is logged in, redirect them to the home page.
        router.push('/');
        router.refresh(); // Force a refresh to update layout and user state
    }
     setLoading(false);
  };
  
   const handleGoogleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not sign up with Google. ' + error.message,
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <SiteLogo className="h-12 w-12 mx-auto text-primary" />
          <CardTitle className="text-2xl mt-4">Create an account for {clubName}</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAccount}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
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
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
              <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignup} disabled={loading}>
                Sign up with Google
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
