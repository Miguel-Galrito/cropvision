/**
 * CropVision SaaS - Supabase Service Role Admin Client
 * Server-only client with elevated privileges for webhooks, licensing & synchronization.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './supabaseClient';

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZHhia2RrZ3hzanJlcHh2dWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM3ODEwOSwiZXhwIjoyMTA0OTU0MTA5fQ.IHltV6Odcg5-VFjyqo2uQ_5vPB63xfZKNvi4RJqQOBo';

export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const isSupabaseAdminConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(serviceRoleKey) &&
    !SUPABASE_URL.includes('your-project-ref')
  );
};
