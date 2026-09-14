import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Whop Webhook Handler
 * Synchronizes user memberships and plan tier with Supabase profiles table.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('whop-signature') || req.headers.get('x-whop-signature') || '';
    const secret = process.env.WHOP_WEBHOOK_SECRET;

    // Verify webhook signature if secret is defined and signature is provided
    if (secret && signature) {
      try {
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(rawBody)
          .digest('hex');

        // Whop might send format like "t=...,v1=..." or direct hex
        const normalizedSig = signature.includes('v1=') 
          ? signature.split('v1=')[1].split(',')[0]
          : signature;

        if (normalizedSig !== expectedSignature && signature !== secret) {
          console.warn('[Whop Webhook] Signature verification failed');
          return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }
      } catch (err: any) {
        console.warn('[Whop Webhook] Error checking signature:', err.message);
      }
    }

    const payload = JSON.parse(rawBody);
    const action = payload.action || payload.event || payload.type || '';
    const data = payload.data || payload;

    // Extract identifiers
    const email = (
      data.email ||
      data.user?.email ||
      data.customer_email ||
      data.membership?.user?.email ||
      ''
    ).toLowerCase().trim();

    const whopUserId = data.user_id || data.user?.id || data.membership?.user?.id || data.id || '';
    const planNameOrId = String(data.plan_id || data.plan?.name || data.product_id || data.product?.name || '').toLowerCase();

    // Map plan tier
    let planId: 'solo' | 'herdade_pro' | 'enterprise' = 'solo';
    if (planNameOrId.includes('enterprise')) {
      planId = 'enterprise';
    } else if (planNameOrId.includes('pro') || planNameOrId.includes('herdade')) {
      planId = 'herdade_pro';
    }

    // Determine status
    let membershipStatus: 'free' | 'active' | 'past_due' | 'canceled' = 'free';

    if (
      action.includes('went_valid') || 
      action.includes('created') || 
      action.includes('payment.succeeded') ||
      action.includes('active')
    ) {
      membershipStatus = 'active';
    } else if (
      action.includes('went_invalid') || 
      action.includes('past_due') || 
      action.includes('payment.failed')
    ) {
      membershipStatus = 'past_due';
    } else if (
      action.includes('canceled') || 
      action.includes('deleted') || 
      action.includes('expired')
    ) {
      membershipStatus = 'canceled';
    } else {
      // Default to active if status field says active
      if (data.status === 'active' || data.membership?.status === 'active') {
        membershipStatus = 'active';
      }
    }

    console.log(`[Whop Webhook] Processed ${action} for ${email || whopUserId} -> status: ${membershipStatus}, plan: ${planId}`);

    // If Supabase Admin is available, upsert to profiles
    if (isSupabaseAdminConfigured() && email) {
      const updateData: any = {
        email,
        membership_status: membershipStatus,
        plan_id: planId,
        updated_at: new Date().toISOString(),
      };

      if (whopUserId) {
        updateData.whop_user_id = whopUserId;
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .upsert(updateData, { onConflict: 'email' });

      if (error) {
        console.error('[Whop Webhook] Failed to upsert profile in Supabase:', error.message);
        return NextResponse.json({ success: true, synced: false, warning: error.message });
      }

      return NextResponse.json({
        success: true,
        synced: true,
        action,
        status: membershipStatus,
        plan: planId,
        email,
      });
    }

    return NextResponse.json({
      success: true,
      synced: false,
      notice: 'Webhook received and parsed, Supabase database sync pending or offline',
      action,
      status: membershipStatus,
      plan: planId,
    });
  } catch (error: any) {
    console.error('[Whop Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
