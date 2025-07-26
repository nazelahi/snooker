'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminCheckPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    checkAdminUsers();
  }, []);

  const checkAdminUsers = async () => {
    try {
      // Get all profiles with admin status
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch user data.",
        });
        return;
      }

      const admins = profiles.filter(p => p.is_admin);
      const regularUsers = profiles.filter(p => !p.is_admin);

      setAdminUsers(admins);
      setAllUsers(regularUsers);
    } catch (error) {
      console.error('Error checking admin users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to promote user to admin.",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User promoted to admin successfully.",
      });

      // Refresh the list
      checkAdminUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };

  const demoteFromAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: false })
        .eq('id', userId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to demote admin user.",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Admin privileges removed successfully.",
      });

      // Refresh the list
      checkAdminUsers();
    } catch (error) {
      console.error('Error demoting user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Loading admin information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Management</h1>
        <p className="text-muted-foreground">
          Check and manage admin users in your system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="destructive">Admin Users</Badge>
              {adminUsers.length} Found
            </CardTitle>
            <CardDescription>
              Users with administrative privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => demoteFromAdmin(user.id)}
                        >
                          Remove Admin
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No admin users found
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Regular Users</Badge>
              {allUsers.length} Found
            </CardTitle>
            <CardDescription>
              Users without administrative privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.slice(0, 10).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => promoteToAdmin(user.id)}
                        >
                          Make Admin
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No regular users found
              </p>
            )}
            {allUsers.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing first 10 users. Total: {allUsers.length}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Setup</CardTitle>
            <CardDescription>
              Create a new admin account or manage existing ones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={() => router.push('/setup-admin')}>
                Create New Admin
              </Button>
              <Button variant="outline" onClick={checkAdminUsers}>
                Refresh List
              </Button>
            </div>
            
            {adminUsers.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">No Admin Users Found</h3>
                <p className="text-sm text-yellow-700">
                  You need to create at least one admin user to manage the system.
                  Click "Create New Admin" to set up your first admin account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Admin Information:</h3>
        <ul className="text-sm space-y-1">
          <li>• Total Users: {adminUsers.length + allUsers.length}</li>
          <li>• Admin Users: {adminUsers.length}</li>
          <li>• Regular Users: {allUsers.length}</li>
          <li>• Setup URL: <code className="bg-background px-1 rounded">/setup-admin</code></li>
        </ul>
      </div>
    </div>
  );
} 