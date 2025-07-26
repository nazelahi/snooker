'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function TestRLSPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testRLSPolicies = async () => {
    setIsLoading(true);
    setTestResults(null);

    const results = {
      auth: null,
      profileRead: null,
      profileWrite: null,
      playerRead: null,
      playerWrite: null,
      error: null
    };

    try {
      // Test 1: Check if we can read profiles (should work for everyone)
      console.log('Testing profile read access...');
      const { data: profiles, error: profileReadError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      results.profileRead = {
        success: !profileReadError,
        error: profileReadError?.message,
        data: profiles
      };

      // Test 2: Check if we can read players (should work for everyone)
      console.log('Testing player read access...');
      const { data: players, error: playerReadError } = await supabase
        .from('players')
        .select('*')
        .limit(1);

      results.playerRead = {
        success: !playerReadError,
        error: playerReadError?.message,
        data: players
      };

      // Test 3: Try to create a profile (should fail without auth)
      console.log('Testing profile write access...');
      const testProfile = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'test@example.com',
        username: 'testuser',
        full_name: 'Test User'
      };

      const { data: profileWriteData, error: profileWriteError } = await supabase
        .from('profiles')
        .insert(testProfile)
        .select()
        .single();

      results.profileWrite = {
        success: !profileWriteError,
        error: profileWriteError?.message,
        data: profileWriteData
      };

      // Test 4: Try to create a player (should fail without auth)
      console.log('Testing player write access...');
      const testPlayer = {
        profile_id: '00000000-0000-0000-0000-000000000000',
        nickname: 'Test Player',
        skill_level: 5,
        preferred_hand: 'right',
        experience_years: 0
      };

      const { data: playerWriteData, error: playerWriteError } = await supabase
        .from('players')
        .insert(testPlayer)
        .select()
        .single();

      results.playerWrite = {
        success: !playerWriteError,
        error: playerWriteError?.message,
        data: playerWriteData
      };

      // Test 5: Check current auth status
      console.log('Testing auth status...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      results.auth = {
        success: !authError,
        error: authError?.message,
        session: session ? 'Authenticated' : 'Not authenticated',
        user: session?.user?.id
      };

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const getTestResultBadge = (result: any) => {
    if (!result) return <Badge variant="secondary">Not Tested</Badge>;
    return result.success ? 
      <Badge variant="default">✅ Success</Badge> : 
      <Badge variant="destructive">❌ Failed</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">RLS Policy Test</h1>
        <p className="text-muted-foreground">
          Test Row Level Security policies and database permissions
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={testRLSPolicies} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Testing RLS Policies..." : "Test RLS Policies"}
        </Button>
      </div>

      {testResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Authentication Status
                {getTestResultBadge(testResults.auth)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.auth ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span> {testResults.auth.session}
                  </p>
                  {testResults.auth.user && (
                    <p className="text-sm">
                      <span className="font-medium">User ID:</span> {testResults.auth.user}
                    </p>
                  )}
                  {testResults.auth.error && (
                    <p className="text-sm text-red-500">
                      <span className="font-medium">Error:</span> {testResults.auth.error}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not tested</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Profile Read Access
                {getTestResultBadge(testResults.profileRead)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.profileRead ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Profiles Found:</span> {testResults.profileRead.data?.length || 0}
                  </p>
                  {testResults.profileRead.error && (
                    <p className="text-sm text-red-500">
                      <span className="font-medium">Error:</span> {testResults.profileRead.error}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not tested</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Profile Write Access
                {getTestResultBadge(testResults.profileWrite)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.profileWrite ? (
                <div className="space-y-2">
                  {testResults.profileWrite.success ? (
                    <p className="text-sm text-green-600">
                      ✅ Profile creation allowed (this might indicate RLS is not working)
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600">
                      ⚠️ Profile creation blocked (expected behavior)
                    </p>
                  )}
                  {testResults.profileWrite.error && (
                    <p className="text-sm text-red-500">
                      <span className="font-medium">Error:</span> {testResults.profileWrite.error}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not tested</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Player Write Access
                {getTestResultBadge(testResults.playerWrite)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.playerWrite ? (
                <div className="space-y-2">
                  {testResults.playerWrite.success ? (
                    <p className="text-sm text-green-600">
                      ✅ Player creation allowed (this might indicate RLS is not working)
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600">
                      ⚠️ Player creation blocked (expected behavior)
                    </p>
                  )}
                  {testResults.playerWrite.error && (
                    <p className="text-sm text-red-500">
                      <span className="font-medium">Error:</span> {testResults.playerWrite.error}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not tested</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Expected Results:</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Profile Read:</strong> Should succeed (public read access)</li>
          <li>• <strong>Player Read:</strong> Should succeed (public read access)</li>
          <li>• <strong>Profile Write:</strong> Should fail without authentication (RLS working)</li>
          <li>• <strong>Player Write:</strong> Should fail without authentication (RLS working)</li>
        </ul>
        
        <h3 className="font-semibold mb-2 mt-4">If Tests Fail:</h3>
        <ul className="text-sm space-y-1">
          <li>• Check if RLS policies are enabled in Supabase</li>
          <li>• Verify the schema.sql script was run completely</li>
          <li>• Check API key permissions</li>
          <li>• Ensure database connection is working</li>
        </ul>
      </div>
    </div>
  );
} 