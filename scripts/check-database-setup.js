#!/usr/bin/env node

// Script to check database setup and provide guidance
// Run with: node scripts/check-database-setup.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseSetup() {
  console.log('🔍 Checking Database Setup...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('💡 Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('✅ Environment variables found');
  console.log(`📡 URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...\n`);
  
  // Test basic connection
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Auth test failed: ${authError.message}`);
    }
    
    console.log('✅ Auth connection successful');
  } catch (error) {
    console.error('❌ Auth connection failed:', error.message);
    process.exit(1);
  }
  
  // Check if tables exist
  const requiredTables = [
    'profiles',
    'players',
    'tournaments',
    'matches',
    'match_players',
    'match_frames',
    'comments',
    'notifications',
    'achievements',
    'player_achievements',
    'challenges',
    'player_challenges',
    'statistics'
  ];
  
  console.log('📊 Checking Database Tables...\n');
  
  let missingTables = [];
  let existingTables = [];
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('Invalid API key')) {
          missingTables.push(tableName);
        } else {
          console.log(`⚠️  Table ${tableName}: ${error.message}`);
          existingTables.push(tableName);
        }
      } else {
        existingTables.push(tableName);
      }
    } catch (error) {
      missingTables.push(tableName);
    }
  }
  
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}\n`);
  
  if (existingTables.length > 0) {
    console.log('📋 Existing Tables:');
    existingTables.forEach(table => console.log(`  ✅ ${table}`));
    console.log('');
  }
  
  if (missingTables.length > 0) {
    console.log('❌ Missing Tables:');
    missingTables.forEach(table => console.log(`  ❌ ${table}`));
    console.log('');
    
    console.log('🔧 SOLUTION:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the entire contents of database/schema.sql');
    console.log('4. Paste and run the SQL script');
    console.log('5. Run this check again: npm run check:database');
    console.log('');
  }
  
  // Test user registration if tables exist
  if (existingTables.includes('profiles')) {
    console.log('🧪 Testing User Registration...');
    
    try {
      // Test creating a profile directly
      const testProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
        full_name: 'Test User'
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(testProfile)
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Profile creation test failed: ${error.message}`);
        
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          console.log('✅ Table structure is correct (duplicate key error is expected)');
        } else if (error.message.includes('RLS')) {
          console.log('⚠️  RLS (Row Level Security) might be blocking the operation');
          console.log('💡 Check your RLS policies in Supabase');
        } else {
          console.log('❌ There might be an issue with the table structure or permissions');
        }
      } else {
        console.log('✅ Profile creation test successful');
        
        // Clean up test data
        await supabase
          .from('profiles')
          .delete()
          .eq('id', 'test-user-id');
      }
      
    } catch (error) {
      console.log(`❌ Profile creation test failed: ${error.message}`);
    }
  }
  
  console.log('\n📋 SUMMARY:');
  console.log(`Total required tables: ${requiredTables.length}`);
  console.log(`Tables present: ${existingTables.length}`);
  console.log(`Tables missing: ${missingTables.length}`);
  
  if (missingTables.length === 0) {
    console.log('\n🎉 Database setup appears to be correct!');
    console.log('💡 If you\'re still having issues, check:');
    console.log('   - RLS (Row Level Security) policies');
    console.log('   - API key permissions');
    console.log('   - Network connectivity');
  } else {
    console.log('\n⚠️  Database setup incomplete!');
    console.log('💡 Please run the schema.sql script in your Supabase SQL Editor');
  }
  
  console.log('\n🔗 Useful URLs:');
  console.log('- Database Schema: http://localhost:9002/database-schema');
  console.log('- Test Registration: http://localhost:9002/test-registration');
  console.log('- Setup Admin: http://localhost:9002/setup-admin');
}

// Run the check
checkDatabaseSetup().catch(console.error); 