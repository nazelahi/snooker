
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

  const handleCreateAccount = async () => {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
       toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } else if (data.user) {
        if (data.user.identities?.length === 0) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An account with this email already exists but is unconfirmed.",
            });
        } else {
            toast({
                title: "Success!",
                description: "Your account has been created. Please check your email to verify your account.",
            });
            router.push('/login');
        }
    }
    setLoading(false);
  };
  
  const handleGoogleSignup = async () => {
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
        description: 'Could not sign up with Google. ' + error.message,
      });
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <SiteLogo className="h-12 w-12 mx-auto text-primary" />
          <CardTitle className="text-2xl mt-4">Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button type="button" className="w-full" onClick={handleCreateAccount} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
              Sign up with Google
            </Button>
          </div>
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
