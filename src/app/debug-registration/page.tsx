'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function DebugRegistrationPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stepResults, setStepResults] = useState<any>({});
  const [formData, setFormData] = useState({
    email: 'test@example.com',
    password: 'testpassword123',
    username: 'testuser',
    fullName: 'Test User'
  });

  const testStep1 = async () => {
    setIsLoading(true);
    try {
      console.log('Step 1: Creating user in Supabase Auth...');
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.fullName,
            name: formData.fullName,
          },
        },
      });

      if (error) {
        setStepResults(prev => ({ ...prev, step1: { success: false, error: error.message } }));
        toast({
          variant: "destructive",
          title: "Step 1 Failed",
          description: error.message,
        });
        return;
      }

      if (!data.user) {
        setStepResults(prev => ({ ...prev, step1: { success: false, error: 'No user returned' } }));
        toast({
          variant: "destructive",
          title: "Step 1 Failed",
          description: "No user returned from auth signup",
        });
        return;
      }

      setStepResults(prev => ({ 
        ...prev, 
        step1: { 
          success: true, 
          user: data.user,
          session: data.session 
        } 
      }));

      toast({
        title: "Step 1 Success",
        description: "User created in Supabase Auth",
      });

      return data.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStepResults(prev => ({ ...prev, step1: { success: false, error: errorMessage } }));
      toast({
        variant: "destructive",
        title: "Step 1 Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Fetch profile (no insert)
  const testStep2 = async (userId: string) => {
    setIsLoading(true);
    try {
      console.log('Step 2: Fetching profile from database...');
      let profile = null;
      for (let i = 0; i < 5; i++) {
        const { data: p, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (p) {
          profile = p;
          break;
        }
        await new Promise(res => setTimeout(res, 500)); // wait 0.5s
      }
      if (!profile) {
        setStepResults(prev => ({ ...prev, step2: { success: false, error: 'Profile not found after signup' } }));
        toast({
          variant: "destructive",
          title: "Step 2 Failed",
          description: "Profile not found after signup",
        });
        return;
      }
      setStepResults(prev => ({ 
        ...prev, 
        step2: { 
          success: true, 
          profile 
        } 
      }));
      toast({
        title: "Step 2 Success",
        description: "Profile fetched from database",
      });
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStepResults(prev => ({ ...prev, step2: { success: false, error: errorMessage } }));
      toast({
        variant: "destructive",
        title: "Step 2 Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testStep3 = async (userId: string) => {
    setIsLoading(true);
    try {
      console.log('Step 3: Creating player profile...');
      
      const { data, error } = await supabase
        .from('players')
        .insert({
          profile_id: userId,
          nickname: formData.fullName,
          skill_level: 5,
          preferred_hand: 'right',
          experience_years: 0,
        })
        .select()
        .single();

      if (error) {
        setStepResults(prev => ({ ...prev, step3: { success: false, error: error.message } }));
        toast({
          variant: "destructive",
          title: "Step 3 Failed",
          description: error.message,
        });
        return;
      }

      setStepResults(prev => ({ 
        ...prev, 
        step3: { 
          success: true, 
          player: data 
        } 
      }));

      toast({
        title: "Step 3 Success",
        description: "Player profile created",
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStepResults(prev => ({ ...prev, step3: { success: false, error: errorMessage } }));
      toast({
        variant: "destructive",
        title: "Step 3 Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTest = async () => {
    setStepResults({});
    
    // Step 1: Create user in Auth
    const user = await testStep1();
    if (!user) return;

    // Step 2: Fetch profile (no insert)
    const profile = await testStep2(user.id);
    if (!profile) return;

    // Step 3: Create player
    await testStep3(user.id);
  };

  const cleanup = async () => {
    if (stepResults.step1?.user?.id) {
      try {
        await supabase.auth.admin.deleteUser(stepResults.step1.user.id);
        toast({
          title: "Cleanup Complete",
          description: "Test user removed",
        });
        setStepResults({});
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  };

  const getStepBadge = (step: string) => {
    const result = stepResults[step];
    if (!result) return <Badge variant="secondary">Not Run</Badge>;
    return result.success ? 
      <Badge variant="default">✅ Success</Badge> : 
      <Badge variant="destructive">❌ Failed</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Registration Debug</h1>
        <p className="text-muted-foreground">
          Step-by-step debugging of user registration process
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Data</CardTitle>
            <CardDescription>
              Registration test data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
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
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runFullTest} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Running Test..." : "Run Full Test"}
              </Button>
              <Button 
                onClick={cleanup} 
                variant="outline"
                disabled={isLoading || !stepResults.step1?.user}
              >
                Cleanup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Step-by-step results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                Step 1: Auth Signup
                {getStepBadge('step1')}
              </h4>
              {stepResults.step1 && (
                <div className="text-sm space-y-1">
                  {stepResults.step1.success ? (
                    <div>
                      <p className="text-green-600">✅ User created in Auth</p>
                      <p className="text-xs text-muted-foreground">ID: {stepResults.step1.user?.id}</p>
                    </div>
                  ) : (
                    <p className="text-red-600">❌ {stepResults.step1.error}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                Step 2: Profile Fetch
                {getStepBadge('step2')}
              </h4>
              {stepResults.step2 && (
                <div className="text-sm space-y-1">
                  {stepResults.step2.success ? (
                    <div>
                      <p className="text-green-600">✅ Profile fetched from database</p>
                      <p className="text-xs text-muted-foreground">Username: {stepResults.step2.profile?.username}</p>
                    </div>
                  ) : (
                    <p className="text-red-600">❌ {stepResults.step2.error}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                Step 3: Player Creation
                {getStepBadge('step3')}
              </h4>
              {stepResults.step3 && (
                <div className="text-sm space-y-1">
                  {stepResults.step3.success ? (
                    <div>
                      <p className="text-green-600">✅ Player profile created</p>
                      <p className="text-xs text-muted-foreground">Nickname: {stepResults.step3.player?.nickname}</p>
                    </div>
                  ) : (
                    <p className="text-red-600">❌ {stepResults.step3.error}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Common Issues & Solutions:</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Step 1 fails:</strong> Check Supabase Auth settings and email confirmation</li>
          <li>• <strong>Step 2 fails:</strong> Check RLS policies and database permissions</li>
          <li>• <strong>Step 3 fails:</strong> Check foreign key constraints and RLS policies</li>
          <li>• <strong>RLS errors:</strong> Run the complete schema.sql script in Supabase</li>
        </ul>
      </div>
    </div>
  );
} 