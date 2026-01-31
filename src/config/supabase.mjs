import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Відсутні SUPABASE_URL або SUPABASE_ANON_KEY в .env файлі');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;