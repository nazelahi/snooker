'use client';

import { useState, useEffect } from 'react';
import { getDatabaseSchema, getTableStructure, getSampleData, TableInfo } from '@/lib/supabase-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Database, Table as TableIcon, Users, Trophy, MessageSquare, Bell, Award, Target } from 'lucide-react';

export default function DatabaseSchemaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [sampleData, setSampleData] = useState<any[]>([]);

  const handleLoadSchema = async () => {
    setIsLoading(true);
    try {
      const results = await getDatabaseSchema();
      setSchema(results);
    } catch (error) {
      console.error('Error loading schema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    try {
      const data = await getSampleData(tableName, 5);
      setSampleData(data);
    } catch (error) {
      console.error('Error loading sample data:', error);
      setSampleData([]);
    }
  };

  const getTableIcon = (tableName: string) => {
    const icons: { [key: string]: any } = {
      profiles: Users,
      players: Users,
      matches: TableIcon,
      tournaments: Trophy,
      comments: MessageSquare,
      notifications: Bell,
      achievements: Award,
      challenges: Target
    };
    return icons[tableName] || Database;
  };

  useEffect(() => {
    handleLoadSchema();
  }, []);

  const existingTables = schema.filter(table => table.exists);
  const missingTables = schema.filter(table => !table.exists);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Schema</h1>
        <p className="text-muted-foreground">
          Inspect your Supabase database structure and table information
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={handleLoadSchema} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Loading Schema...' : 'Refresh Schema'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Table Details</TabsTrigger>
          <TabsTrigger value="missing">Missing Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schema.length}</div>
                <p className="text-xs text-muted-foreground">
                  {existingTables.length} existing, {missingTables.length} missing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Existing Tables</CardTitle>
                <TableIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{existingTables.length}</div>
                <p className="text-xs text-muted-foreground">
                  Tables found in database
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missing Tables</CardTitle>
                <TableIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{missingTables.length}</div>
                <p className="text-xs text-muted-foreground">
                  Tables not found
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {existingTables.reduce((sum, table) => sum + (table.rowCount || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all tables
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Table Summary</CardTitle>
              <CardDescription>
                Overview of all tables in your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Columns</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schema.map((table) => {
                    const Icon = getTableIcon(table.tableName);
                    return (
                      <TableRow key={table.tableName}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {table.tableName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={table.exists ? "default" : "secondary"}>
                            {table.exists ? "Exists" : "Missing"}
                          </Badge>
                        </TableCell>
                        <TableCell>{table.columns.length}</TableCell>
                        <TableCell>{table.rowCount || 0}</TableCell>
                        <TableCell>
                          {table.exists && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTableSelect(table.tableName)}
                            >
                              View Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          {existingTables.map((table) => {
            const Icon = getTableIcon(table.tableName);
            return (
              <Card key={table.tableName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {table.tableName}
                    <Badge variant="outline">{table.columns.length} columns</Badge>
                    <Badge variant="secondary">{table.rowCount || 0} rows</Badge>
                  </CardTitle>
                  <CardDescription>
                    Table structure and column information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Columns</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nullable</TableHead>
                            <TableHead>Primary Key</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {table.columns.map((column) => (
                            <TableRow key={column.name}>
                              <TableCell className="font-medium">{column.name}</TableCell>
                              <TableCell>{column.type}</TableCell>
                              <TableCell>
                                <Badge variant={column.isNullable ? "secondary" : "default"}>
                                  {column.isNullable ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {column.isPrimaryKey && (
                                  <Badge variant="outline">Primary Key</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Sample Data</h4>
                      {selectedTable === table.tableName && sampleData.length > 0 ? (
                        <div className="space-y-2">
                          {sampleData.map((row, index) => (
                            <div key={index} className="p-3 bg-muted rounded-md">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(row, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTableSelect(table.tableName)}
                        >
                          Load Sample Data
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="missing" className="space-y-6">
          {missingTables.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Missing Tables</CardTitle>
                <CardDescription>
                  These tables are expected but not found in your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {missingTables.map((table) => (
                    <div key={table.tableName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{table.tableName}</p>
                          <p className="text-sm text-muted-foreground">
                            {table.error || 'Table not found'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Missing</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Missing Tables</CardTitle>
                <CardDescription>
                  All expected tables are present in your database
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 