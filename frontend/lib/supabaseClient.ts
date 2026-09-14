/**
 * CropVision SaaS - Supabase Browser Client
 * Resilient multi-tenant client with automatic fallback for offline and unconfigured environments.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Normalize Supabase URL (support direct URL or project reference)
function resolveSupabaseUrl(url: string): string {
  if (!url) return 'https://mvdxbkdkgxsjrepxvugt.supabase.co';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('sb_') || !url.includes('.')) {
    return 'https://mvdxbkdkgxsjrepxvugt.supabase.co';
  }
  return `https://${url}.supabase.co`;
}

export const SUPABASE_URL = resolveSupabaseUrl(rawUrl);
export const SUPABASE_ANON_KEY =
  rawAnonKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZHhia2RrZ3hzanJlcHh2dWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNzgxMDksImV4cCI6MjEwNDk1NDEwOX0.ht5s4rS7Ba6cFCaW3x7KAfFadAKgi3fRWGLyglPQviI';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(rawUrl && rawAnonKey);
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
