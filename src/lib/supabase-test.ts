import { supabase } from './supabase';

export async function testSupabaseConnection() {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔍 Checking Supabase configuration...');
    
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    }
    
    console.log('✅ Environment variables are configured');
    console.log(`📡 Supabase URL: ${supabaseUrl.substring(0, 20)}...`);
    console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
    
    // Test the connection by making a simple query
    console.log('🔄 Testing connection...');
    
    const { data, error } = await supabase
      .from('profiles') // Replace with an actual table name from your database
      .select('*')
      .limit(1);
    
    if (error) {
      // If the table doesn't exist, try a different approach
      console.log('⚠️  Table query failed, trying auth test...');
      
      // Test auth connection instead
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw new Error(`Connection failed: ${authError.message}`);
      }
      
      console.log('✅ Supabase connection successful (auth test)');
      return {
        success: true,
        message: 'Supabase connection is working',
        authTest: true
      };
    }
    
    console.log('✅ Supabase connection successful (data test)');
    return {
      success: true,
      message: 'Supabase connection is working',
      dataTest: true,
      rowCount: data?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Supabase connection failed'
    };
  }
}

// Function to test specific tables
export async function testTableConnection(tableName: string) {
  try {
    console.log(`🔍 Testing connection to table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      throw new Error(`Table query failed: ${error.message}`);
    }
    
    console.log(`✅ Table ${tableName} is accessible`);
    console.log(`📊 Found ${data?.length || 0} rows`);
    
    return {
      success: true,
      tableName,
      rowCount: data?.length || 0,
      data: data
    };
    
  } catch (error) {
    console.error(`❌ Table ${tableName} test failed:`, error);
    return {
      success: false,
      tableName,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 