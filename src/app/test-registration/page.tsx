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

export default function TestRegistrationPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: ''
  });

  const handleTestRegistration = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      // Test registration
      const result = await authService.signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        fullName: formData.fullName
      });

      // Check if profile was created
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', result.user.id)
        .single();

      // Check if player was created
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('profile_id', result.user.id)
        .single();

      setTestResults({
        success: true,
        user: result.user,
        profile: profileData,
        player: playerData,
        profileError,
        playerError
      });

      toast({
        title: "Test Successful",
        description: "User registration and profile creation completed successfully!",
      });

    } catch (error) {
      console.error('Test registration error:', error);
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        variant: "destructive",
        title: "Test Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!testResults?.user?.id) return;

    try {
      // Delete the test user
      const { error } = await supabase.auth.admin.deleteUser(testResults.user.id);
      
      if (error) {
        console.error('Cleanup error:', error);
      } else {
        toast({
          title: "Cleanup Complete",
          description: "Test user has been removed.",
        });
        setTestResults(null);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Registration Test</h1>
        <p className="text-muted-foreground">
          Test user registration and profile creation functionality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Registration</CardTitle>
            <CardDescription>
              Create a test user account to verify the registration process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
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
                placeholder="test@example.com"
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
                placeholder="password123"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleTestRegistration} 
              disabled={isLoading || !formData.email || !formData.password || !formData.username || !formData.fullName}
              className="w-full"
            >
              {isLoading ? "Testing Registration..." : "Test Registration"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from the registration test
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={testResults.success ? "default" : "destructive"}>
                    {testResults.success ? "Success" : "Failed"}
                  </Badge>
                  <span className="text-sm font-medium">
                    Registration Test
                  </span>
                </div>

                {testResults.success ? (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">User Account</h4>
                      <p className="text-xs text-muted-foreground">
                        ID: {testResults.user?.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Email: {testResults.user?.email}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">Profile</h4>
                      {testResults.profile ? (
                        <div className="text-xs text-muted-foreground">
                          <p>Username: {testResults.profile.username}</p>
                          <p>Full Name: {testResults.profile.full_name}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-red-500">Profile creation failed</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">Player Profile</h4>
                      {testResults.player ? (
                        <div className="text-xs text-muted-foreground">
                          <p>Nickname: {testResults.player.nickname}</p>
                          <p>Skill Level: {testResults.player.skill_level}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-orange-500">Player profile creation failed</p>
                      )}
                    </div>

                    <Button 
                      onClick={handleCleanup} 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      Cleanup Test User
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-red-500">{testResults.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No test results yet. Run a test to see results here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">What This Test Does:</h3>
        <ul className="text-sm space-y-1">
          <li>• Creates a user account in Supabase Auth</li>
          <li>• Creates a profile record in the profiles table</li>
          <li>• Creates a player record in the players table</li>
          <li>• Verifies all records were created successfully</li>
          <li>• Provides cleanup functionality to remove test data</li>
        </ul>
      </div>
    </div>
  );
} 