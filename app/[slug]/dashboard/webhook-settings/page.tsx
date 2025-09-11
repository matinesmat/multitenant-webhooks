import WebhookSettingsClient from "@/components/WebhookSettingsClient";
import { safeDecodeURIComponent } from "@/lib/urlUtils";
import { createServerSupabaseClient } from "@/lib/supabase";

type WebhookSettings = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  resources: string[];
  events: string[];
  retry_policy: {
    max_retries: number;
    backoff_multiplier: number;
    initial_delay: number;
  };
  secret_key?: string;
  created_at: string;
  updated_at: string;
};

type WebhookFromDB = {
  id: string;
  name: string | null;
  url: string;
  enabled: boolean;
  resources: string[];
  events: string[];
  retry_policy?: {
    max_retries: number;
    backoff_multiplier: number;
    initial_delay: number;
  };
  secret_key?: string;
  created_at: string;
  updated_at: string;
};

export default async function WebhookSettingsPage({ 
  params
}: { 
  params: Promise<{ slug: string }>;
}) {
  const { slug: encodedSlug } = await params;
  const slug = safeDecodeURIComponent(encodedSlug);
  const supabase = await createServerSupabaseClient();

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  // Get webhook settings
  const { data: webhooks } = await supabase
    .from('webhook_settings')
    .select('*')
    .eq('org_slug', slug)
    .order('created_at', { ascending: false });

  // Transform webhook data
  const webhookSettings: WebhookSettings[] = (webhooks ?? []).map((webhook: WebhookFromDB) => ({
    id: webhook.id,
    name: webhook.name || 'Unnamed Webhook',
    url: webhook.url,
    enabled: webhook.enabled ?? true,
    resources: webhook.resources || [],
    events: webhook.events || [],
    retry_policy: webhook.retry_policy || {
      max_retries: 3,
      backoff_multiplier: 2,
      initial_delay: 1000
    },
    secret_key: webhook.secret_key,
    created_at: webhook.created_at,
    updated_at: webhook.updated_at
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Webhook Settings</h1>
        <p className="text-gray-600 mt-1">Configure webhook delivery for {organization?.name || 'your organization'}</p>
      </div>

      <WebhookSettingsClient 
        webhooks={webhookSettings}
        organizationName={organization?.name || 'your organization'}
        slug={slug}
      />
    </div>
  );
}
