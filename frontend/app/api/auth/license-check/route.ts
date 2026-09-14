import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase().trim();
    const whopUserId = searchParams.get('whop_user_id')?.trim();

    if (!email && !whopUserId) {
      return NextResponse.json(
        { active: false, error: 'Missing email or whop_user_id parameter' },
        { status: 400 }
      );
    }

    if (!isSupabaseAdminConfigured()) {
      // In offline / local fallback mode
      return NextResponse.json({
        active: false,
        status: 'unconfigured',
        plan: 'free',
        message: 'Database persistence not yet configured. Operating in local mode.',
        maxParcels: 3,
        features: ['basic_ndvi'],
      });
    }

    let query = supabaseAdmin.from('profiles').select('*');

    if (email) {
      query = query.eq('email', email);
    } else if (whopUserId) {
      query = query.eq('whop_user_id', whopUserId);
    }

    const { data: profile, error } = await query.maybeSingle();

    if (error) {
      console.warn('[License Check] Query error:', error.message);
      return NextResponse.json({
        active: false,
        status: 'unknown',
        plan: 'free',
        error: error.message,
      });
    }

    if (!profile) {
      return NextResponse.json({
        active: false,
        status: 'not_found',
        plan: 'free',
        message: 'No subscription account found for this user.',
      });
    }

    const isActive = profile.membership_status === 'active';
    const plan = profile.plan_id || 'solo';

    const maxParcels = plan === 'enterprise' ? 999 : plan === 'herdade_pro' ? 50 : 5;
    const features = [
      'sentinel2_ndvi',
      'sentinel1_sar',
      'ndwi_moisture',
      'fao56_irrigation',
      'fungal_disease_models',
      'isobus_variable_rate',
      'pdf_audit_export',
      ...(plan === 'enterprise' ? ['api_access', 'custom_white_label', 'dedicated_support'] : []),
    ];

    return NextResponse.json({
      active: isActive,
      status: profile.membership_status,
      plan,
      email: profile.email,
      maxParcels,
      features,
      lastSync: profile.updated_at,
    });
  } catch (err: any) {
    console.error('[License Check] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
