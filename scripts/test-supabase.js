#!/usr/bin/env node

// Simple script to test Supabase connection
// Run with: node scripts/test-supabase.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    console.log('💡 Add NEXT_PUBLIC_SUPABASE_URL to your .env.local file');
    process.exit(1);
  }
  
  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    console.log('💡 Add NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables found');
  console.log(`📡 URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...\n`);
  
  try {
    // Create client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🔄 Testing connection...');
    
    // Test auth connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Auth test failed: ${authError.message}`);
    }
    
    console.log('✅ Auth connection successful');
    
    // Test data connection with a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Data query failed, but auth is working');
      console.log(`   Error: ${error.message}`);
      console.log('\n✅ Supabase connection is working (auth only)');
    } else {
      console.log('✅ Data connection successful');
      console.log(`📊 Found ${data?.length || 0} rows in profiles table`);
    }
    
    console.log('\n🎉 Supabase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your Supabase URL and API key');
    console.log('2. Ensure your Supabase project is active');
    console.log('3. Check your network connection');
    console.log('4. Verify your RLS policies if testing data access');
    process.exit(1);
  }
}

// Run the test
testConnection().catch(console.error); 