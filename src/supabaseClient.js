import { createClient } from '@supabase/supabase-js'

// ============================================================
// FILL THESE IN with your own Supabase project's values.
// Find them in: Supabase dashboard -> Project Settings -> API
// ============================================================
const SUPABASE_URL = 'https://owrzasiveombjcmuptrh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cnphc2l2ZW9tYmpjbXVwdHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3Nzk4NTEsImV4cCI6MjA5OTM1NTg1MX0.BfZan400mxmmfvl9pb5g2i49HWIB7dMgAjiwnVAeaYc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
