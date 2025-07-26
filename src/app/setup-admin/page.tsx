'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SetupAdminPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: ''
  });

  const handleSetupAdmin = async () => {
    if (!formData.email || !formData.password || !formData.username || !formData.fullName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create user account
      const result = await authService.signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        fullName: formData.fullName
      });

      // Step 2: Update profile to make user admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', result.user.id);

      if (updateError) {
        console.error('Admin update error:', updateError);
        toast({
          variant: "destructive",
          title: "Admin Setup Failed",
          description: "User created but admin privileges could not be set. Please contact support.",
        });
        return;
      }

      toast({
        title: "Admin Setup Complete!",
        description: "Admin account has been created successfully. You can now log in.",
      });

      // Redirect to login
      router.push('/login');

    } catch (error) {
      console.error('Admin setup error:', error);
      toast({
        variant: "destructive",
        title: "Admin Setup Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Setup Admin Account</h1>
        <p className="text-muted-foreground">
          Create the first admin account for your snooker application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="destructive">Admin Setup</Badge>
            Administrator Account
          </CardTitle>
          <CardDescription>
            This will create the first admin user with full system privileges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Admin User"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="admin"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Secure password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <Button 
            onClick={handleSetupAdmin} 
            disabled={isLoading || !formData.email || !formData.password || !formData.username || !formData.fullName}
            className="w-full"
          >
            {isLoading ? "Setting up admin..." : "Create Admin Account"}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Admin Privileges:</h3>
        <ul className="text-sm space-y-1">
          <li>• Create and manage tournaments</li>
          <li>• Manage matches and players</li>
          <li>• Access admin settings</li>
          <li>• View system statistics</li>
          <li>• Manage user accounts</li>
        </ul>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>⚠️ Keep your admin credentials secure!</p>
        <p>This account will have full system access.</p>
      </div>
    </div>
  );
} 