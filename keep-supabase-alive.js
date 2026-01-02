import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load variables from .env if present
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
  console.log('--- Supabase Keep-Alive Script ---');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Target: ${supabaseUrl}`);

  try {
    // Perform a simple query to keep the project active
    // We use auth.getSession() or a simple select from a public table if available.
    // Since we don't know the schema, a health check of sorts:
    const { data, error } = await supabase.from('_keep_alive').select('*').limit(1).maybeSingle();
    
    // Even if the table doesn't exist, the request reached Supabase and counts as activity
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      console.warn('Query result (expected error or data):', error.message);
    } else {
      console.log('Successfully contacted Supabase (Activity registered).');
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

keepAlive();
