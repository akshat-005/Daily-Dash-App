/**
 * Push Subscriptions API
 * Manages Web Push subscriptions in Supabase
 */

import { supabase } from '../lib/supabase';

export interface PushSubscription {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    created_at: string;
    updated_at: string;
}

export interface PushSubscriptionKeys {
    endpoint: string;
    p256dh: string;
    auth: string;
}

/**
 * Save a push subscription to the database
 */
export async function savePushSubscription(
    userId: string,
    subscription: PushSubscriptionKeys
): Promise<PushSubscription> {
    const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh,
            auth: subscription.auth,
        }, {
            onConflict: 'user_id,endpoint',
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving push subscription:', error);
        throw error;
    }

    return data;
}

/**
 * Get all push subscriptions for a user
 */
export async function getUserPushSubscriptions(
    userId: string
): Promise<PushSubscription[]> {
    const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching push subscriptions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Delete a push subscription by endpoint
 */
export async function deletePushSubscription(
    userId: string,
    endpoint: string
): Promise<void> {
    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

    if (error) {
        console.error('Error deleting push subscription:', error);
        throw error;
    }
}

/**
 * Delete all push subscriptions for a user
 */
export async function deleteAllPushSubscriptions(
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting all push subscriptions:', error);
        throw error;
    }
}

/**
 * Check if user has any push subscriptions
 */
export async function hasPushSubscription(userId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.error('Error checking push subscription:', error);
        return false;
    }

    return (count ?? 0) > 0;
}
