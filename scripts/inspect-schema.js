#!/usr/bin/env node

// Script to inspect Supabase database schema
// Run with: node scripts/inspect-schema.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function inspectSchema() {
  console.log('🔍 Inspecting Supabase Database Schema...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('💡 Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
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
  
  console.log('📊 Database Schema Analysis\n');
  console.log('='.repeat(60));
  
  let totalTables = 0;
  let existingTables = 0;
  let totalRows = 0;
  
  for (const tableName of commonTables) {
    totalTables++;
    
    try {
      console.log(`\n🔍 Checking table: ${tableName}`);
      
      // Test if table exists
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ Table not found: ${error.message}`);
        continue;
      }
      
      existingTables++;
      console.log(`  ✅ Table exists`);
      
      // Get row count
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      const rowCount = count || 0;
      totalRows += rowCount;
      console.log(`  📊 Rows: ${rowCount}`);
      
      // Analyze structure from sample data
      if (data && data.length > 0) {
        const firstRow = data[0];
        const columns = Object.keys(firstRow);
        console.log(`  🏗️  Columns: ${columns.length}`);
        
        // Show column details
        columns.forEach(col => {
          const value = firstRow[col];
          const type = typeof value;
          const isNullable = value === null;
          const isPrimaryKey = col === 'id' || col.endsWith('_id');
          
          let columnInfo = `    - ${col}: ${type}`;
          if (isPrimaryKey) columnInfo += ' (PK)';
          if (isNullable) columnInfo += ' (nullable)';
          
          console.log(columnInfo);
        });
      } else {
        console.log(`  📝 Table is empty`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tables checked: ${totalTables}`);
  console.log(`Existing tables: ${existingTables}`);
  console.log(`Missing tables: ${totalTables - existingTables}`);
  console.log(`Total rows across all tables: ${totalRows}`);
  
  if (existingTables === 0) {
    console.log('\n⚠️  No tables found!');
    console.log('💡 You may need to:');
    console.log('   1. Create the tables in your Supabase database');
    console.log('   2. Check your RLS policies');
    console.log('   3. Verify your API keys have proper permissions');
  } else if (existingTables < totalTables) {
    console.log('\n⚠️  Some tables are missing');
    console.log('💡 Consider creating the missing tables or updating your schema');
  } else {
    console.log('\n✅ All expected tables are present!');
  }
  
  console.log('\n🎉 Schema inspection completed!');
}

// Run the inspection
inspectSchema().catch(console.error); 