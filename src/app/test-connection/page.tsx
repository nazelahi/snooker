'use client';

import { useState } from 'react';
import { testSupabaseConnection, testTableConnection } from '@/lib/supabase-test';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function TestConnectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [tableResults, setTableResults] = useState<any[]>([]);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setConnectionResult(null);
    setTableResults([]);
    
    try {
      const result = await testSupabaseConnection();
      setConnectionResult(result);
      
      // If connection is successful, test some common tables
      if (result.success) {
        const commonTables = ['profiles', 'matches', 'players', 'tournaments'];
        const tableTests = [];
        
        for (const table of commonTables) {
          const tableResult = await testTableConnection(table);
          tableTests.push(tableResult);
        }
        
        setTableResults(tableTests);
      }
    } catch (error) {
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
        <p className="text-muted-foreground">
          Test your Supabase connection and verify database access
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={handleTestConnection} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Testing Connection...' : 'Test Connection'}
        </Button>
      </div>

      {connectionResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Connection Status
              <Badge variant={connectionResult.success ? "default" : "destructive"}>
                {connectionResult.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {connectionResult.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectionResult.error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive font-medium">Error:</p>
                <p className="text-sm">{connectionResult.error}</p>
              </div>
            )}
            
            {connectionResult.success && (
              <div className="space-y-2">
                {connectionResult.dataTest && (
                  <p className="text-sm">
                    <span className="font-medium">Data Test:</span> ✅ Passed
                    {connectionResult.rowCount !== undefined && (
                      <span className="ml-2">({connectionResult.rowCount} rows found)</span>
                    )}
                  </p>
                )}
                {connectionResult.authTest && (
                  <p className="text-sm">
                    <span className="font-medium">Auth Test:</span> ✅ Passed
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tableResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Table Access Test</CardTitle>
            <CardDescription>
              Testing access to common database tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tableResults.map((result, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{result.tableName}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Accessible" : "Failed"}
                    </Badge>
                  </div>
                  
                  {result.success ? (
                    <p className="text-sm text-muted-foreground">
                      Found {result.rowCount} rows
                    </p>
                  ) : (
                    <p className="text-sm text-destructive">
                      {result.error}
                    </p>
                  )}
                  
                  {index < tableResults.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Environment Variables Required:</h3>
        <ul className="text-sm space-y-1">
          <li><code className="bg-background px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code></li>
          <li><code className="bg-background px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure these are set in your environment variables or .env.local file.
        </p>
      </div>
    </div>
  );
} 