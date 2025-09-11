import { Settings, User, Bell, Shield, Database } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  // Get user
  const { data: { user } } = await supabase.auth.getUser();

  const settingsSections = [
    {
      title: "Profile Settings",
      icon: User,
      description: "Manage your personal information and preferences",
      items: [
        { label: "Full Name", value: user?.user_metadata?.full_name || "Not set" },
        { label: "Email", value: user?.email || "Not set" },
        { label: "Phone", value: "Not set" },
        { label: "Timezone", value: "UTC" },
      ]
    },
    {
      title: "Organization Settings",
      icon: Database,
      description: "Configure your organization settings",
      items: [
        { label: "Organization Name", value: organization?.name || "Not set" },
        { label: "Organization Slug", value: organization?.slug || "Not set" },
        { label: "Created", value: (organization as any)?.created_at ? new Date((organization as any).created_at).toLocaleDateString() : "Not set" },
        { label: "Status", value: "Active" },
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      description: "Manage your notification preferences",
      items: [
        { label: "Email Notifications", value: "Enabled" },
        { label: "Webhook Failures", value: "Enabled" },
        { label: "System Updates", value: "Disabled" },
        { label: "Marketing", value: "Disabled" },
      ]
    },
    {
      title: "Security",
      icon: Shield,
      description: "Security and privacy settings",
      items: [
        { label: "Two-Factor Authentication", value: "Disabled" },
        { label: "Session Timeout", value: "24 hours" },
        { label: "API Access", value: "Enabled" },
        { label: "Data Retention", value: "1 year" },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and organization preferences</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsSections.map((section, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <section.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 px-4 py-2 text-sm border border-input rounded-md hover:bg-accent transition-colors">
              Edit {section.title}
            </button>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Delete Organization</p>
              <p className="text-xs text-muted-foreground">Permanently delete this organization and all its data</p>
            </div>
            <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors">
              Delete Organization
            </button>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Reset All Settings</p>
              <p className="text-xs text-muted-foreground">Reset all settings to their default values</p>
            </div>
            <button className="px-4 py-2 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/10 transition-colors">
              Reset Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
