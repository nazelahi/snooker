import { supabase } from './supabase';

export interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
  rowCount?: number;
  exists: boolean;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
}

export async function getDatabaseSchema(): Promise<TableInfo[]> {
  const commonTables = [
    'profiles',
    'matches', 
    'players',
    'tournaments',
    'comments',
    'notifications',
    'achievements',
    'challenges'
  ];

  const results: TableInfo[] = [];

  for (const tableName of commonTables) {
    try {
      // Try to get table structure by querying with limit 0
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        results.push({
          tableName,
          columns: [],
          exists: false,
          error: error.message
        });
        continue;
      }

      // Get row count
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      // Try to get column information by querying a single row
      const { data: sampleData } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      const columns: ColumnInfo[] = [];
      
      if (sampleData && sampleData.length > 0) {
        const firstRow = sampleData[0];
        Object.keys(firstRow).forEach(key => {
          const value = firstRow[key];
          columns.push({
            name: key,
            type: typeof value,
            isNullable: value === null,
            isPrimaryKey: key === 'id' || key.endsWith('_id'),
            defaultValue: undefined
          });
        });
      }

      results.push({
        tableName,
        columns,
        rowCount: count || 0,
        exists: true
      });

    } catch (error) {
      results.push({
        tableName,
        columns: [],
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

export async function getTableStructure(tableName: string): Promise<TableInfo | null> {
  try {
    // Check if table exists by trying to query it
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return {
        tableName,
        columns: [],
        exists: false,
        error: error.message
      };
    }

    // Get row count
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    // Analyze column structure from sample data
    const columns: ColumnInfo[] = [];
    
    if (data && data.length > 0) {
      const firstRow = data[0];
      Object.keys(firstRow).forEach(key => {
        const value = firstRow[key];
        columns.push({
          name: key,
          type: typeof value,
          isNullable: value === null,
          isPrimaryKey: key === 'id' || key.endsWith('_id'),
          defaultValue: undefined
        });
      });
    }

    return {
      tableName,
      columns,
      rowCount: count || 0,
      exists: true
    };

  } catch (error) {
    return {
      tableName,
      columns: [],
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getSampleData(tableName: string, limit: number = 3): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error(`Error getting sample data from ${tableName}:`, error);
    return [];
  }
} 