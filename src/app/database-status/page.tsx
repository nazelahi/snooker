"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [envVars, setEnvVars] = useState<{
    supabaseUrl: boolean;
    supabaseKey: boolean;
    jwtSecret: boolean;
  }>({
    supabaseUrl: false,
    supabaseKey: false,
    jwtSecret: false
  });

  const checkEnvironmentVariables = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const jwtSecret = process.env.JWT_SECRET;

    setEnvVars({
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      jwtSecret: !!jwtSecret
    });
  };

  const testDatabaseConnection = async () => {
    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/test-database');
      const data = await response.json();

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to test connection');
    }
  };

  useEffect(() => {
    checkEnvironmentVariables();
    testDatabaseConnection();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Database Status</h1>
      
      <div className="space-y-4">
        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if required environment variables are set</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL</span>
              <Badge variant={envVars.supabaseUrl ? "default" : "destructive"}>
                {envVars.supabaseUrl ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {envVars.supabaseUrl ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              <Badge variant={envVars.supabaseKey ? "default" : "destructive"}>
                {envVars.supabaseKey ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {envVars.supabaseKey ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>JWT_SECRET</span>
              <Badge variant={envVars.jwtSecret ? "default" : "destructive"}>
                {envVars.jwtSecret ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {envVars.jwtSecret ? "Set" : "Missing"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Database Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>Test connection to Supabase database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span>Connection Status</span>
              <Badge variant={status === 'success' ? "default" : status === 'error' ? "destructive" : "secondary"}>
                {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-4 h-4" />}
                {status === 'error' && <XCircle className="w-4 h-4" />}
                {status === 'loading' ? 'Testing...' : status === 'success' ? 'Connected' : 'Failed'}
              </Badge>
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Error:</span>
                </div>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            )}
            
            <Button 
              onClick={testDatabaseConnection} 
              disabled={status === 'loading'}
              className="mt-4"
            >
              {status === 'loading' ? 'Testing...' : 'Test Connection'}
            </Button>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Common solutions for database issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-2">
              <p><strong>1. Environment Variables:</strong> Make sure all required environment variables are set in your deployment platform.</p>
              <p><strong>2. Supabase Project:</strong> Check if your Supabase project is active and not paused.</p>
              <p><strong>3. Database Schema:</strong> Ensure your database tables exist and have the correct structure.</p>
              <p><strong>4. Network Access:</strong> Verify that your deployment platform can access Supabase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 