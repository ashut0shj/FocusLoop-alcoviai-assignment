const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase configuration');
  console.error('Please make sure .env file exists with SUPABASE_URL and SUPABASE_KEY');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('students').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    console.log('Please check your Supabase URL and Key');
    process.exit(1);
  }
}

// Run connection test when this module is loaded
testConnection();

module.exports = supabase;
