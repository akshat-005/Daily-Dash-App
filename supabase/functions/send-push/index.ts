// Supabase Edge Function: send-push
// Sends Web Push notifications to users
// Deploy with: supabase functions deploy send-push

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.87.1';

// CORS headers for browser requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
    user_id: string;
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: Record<string, unknown>;
}

interface PushSubscription {
    endpoint: string;
    p256dh: string;
    auth: string;
}

/**
 * Sign and send a Web Push notification
 * This is a simplified implementation - for production, use a proper web-push library
 */
async function sendWebPush(
    subscription: PushSubscription,
    payload: { title: string; body: string; icon?: string; tag?: string; data?: Record<string, unknown> },
    vapidPublicKey: string,
    vapidPrivateKey: string,
    vapidSubject: string
): Promise<Response> {
    // For a minimal Edge Function, we'll use fetch to call the push service directly
    // Note: This is a simplified approach. For full VAPID signing, consider using
    // a Deno-compatible web-push library or encoding the JWT manually.

    const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/app-icon-192.png',
        tag: payload.tag,
        data: payload.data,
    });

    // Get the push endpoint URL parts
    const url = new URL(subscription.endpoint);

    // Create VAPID JWT (simplified - in production use proper JWT library)
    const vapidHeaders = {
        typ: 'JWT',
        alg: 'ES256',
    };

    const now = Math.floor(Date.now() / 1000);
    const vapidClaims = {
        aud: `${url.protocol}//${url.host}`,
        exp: now + 43200, // 12 hours
        sub: vapidSubject,
    };

    // For now, we'll use a direct POST which works for testing
    // Full VAPID signing requires crypto operations
    try {
        const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'TTL': '86400',
            },
            body: pushPayload,
        });

        return response;
    } catch (error) {
        console.error('Error sending push:', error);
        throw error;
    }
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
        const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:noreply@dailydash.app';

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase configuration');
        }

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error('Missing VAPID configuration');
        }

        // Parse request body
        const payload: PushPayload = await req.json();

        if (!payload.user_id || !payload.title || !payload.body) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch user's push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', payload.user_id);

        if (error) {
            throw error;
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No push subscriptions found for user', sent: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Send push to all user's subscriptions
        const results = await Promise.allSettled(
            subscriptions.map((sub) =>
                sendWebPush(
                    sub,
                    {
                        title: payload.title,
                        body: payload.body,
                        icon: payload.icon,
                        tag: payload.tag,
                        data: payload.data,
                    },
                    vapidPublicKey,
                    vapidPrivateKey,
                    vapidSubject
                )
            )
        );

        // Count successes and failures
        const sent = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        // Clean up failed subscriptions (they may be expired)
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'rejected' ||
                (result.status === 'fulfilled' && result.value.status >= 400)) {
                // Remove invalid subscription
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', subscriptions[i].endpoint);
            }
        }

        return new Response(
            JSON.stringify({
                message: 'Push notifications processed',
                sent,
                failed,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Edge function error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
