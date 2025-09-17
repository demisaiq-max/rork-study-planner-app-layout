import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bmxtcqpuhfrvnajozzlw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJteHRjcXB1aGZydm5ham96emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTQ4NDksImV4cCI6MjA3MjIzMDg0OX0.kDn1-ABfpKfUS7jBaUnSWuzNiUweiFp5dFzsOKNi0S0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);