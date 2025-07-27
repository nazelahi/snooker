
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
import { ShieldCheck } from "lucide-react";

export default function AdminSignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkForAdmins = async () => {
        const { data: hasAdmins, error } = await supabase.rpc('has_admins');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify admin status.' });
            router.push('/login');
            return;
        }

        if (hasAdmins) {
            toast({ title: 'Admin Exists', description: 'An admin account has already been set up.' });
            router.push('/login');
        } else {
            setChecking(false);
        }
    };
    checkForAdmins();
  }, [supabase, router, toast]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
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

    if (signUpData.user) {
        // Now that the user exists, and the player profile has been created by the trigger,
        // we can add their ID to the admins table.
        const { error: adminError } = await supabase
            .from('admins')
            .insert({ user_id: signUpData.user.id });

        if (adminError) {
             toast({
                variant: "destructive",
                title: "Admin Creation Failed",
                description: "User was created, but could not be granted admin privileges. " + adminError.message,
             });
        } else {
             toast({
                title: "Admin Account Created!",
                description: "Your administrator account has been created successfully.",
            });
             router.push('/login');
        }
    }
     setLoading(false);
  };

  if (checking) {
      return (
        <div className="flex items-center justify-center h-full">
          <p>Verifying system status...</p>
        </div>
      );
  }

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
          <CardTitle className="text-2xl mt-4">Create First Admin</CardTitle>
          <CardDescription>
            This page is for setting up the first administrator account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Admin User"
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
                  placeholder="admin@example.com"
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
                {loading ? 'Creating account...' : 'Create Admin Account'}
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
