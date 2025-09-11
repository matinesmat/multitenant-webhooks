import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";

export default async function AgenciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  // Get agencies
  const { data: agencies } = await supabase
    .from('agencies')
    .select(`
      *,
      agency_student(count),
      applications(count)
    `)
    .eq('organization_id', organization?.id)
    .order('name');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agencies</h1>
          <p className="text-muted-foreground mt-1">Manage agency partnerships and relationships</p>
        </div>
        <Link
          href={`/${slug}/dashboard/agencies/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Agency
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search agencies..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg hover:bg-accent transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Agencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agencies?.map((agency) => (
          <div key={agency.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">🏛️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{agency.name}</h3>
                  <p className="text-sm text-muted-foreground">{agency.contact_email}</p>
                </div>
              </div>
              <button className="p-1 hover:bg-accent rounded-md">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium">{agency.agency_student?.[0]?.count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Applications</span>
                <span className="font-medium">{agency.applications?.[0]?.count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/${slug}/dashboard/agencies/${agency.id}`}
                className="flex-1 text-center px-3 py-2 text-sm border border-input rounded-md hover:bg-accent transition-colors"
              >
                View Details
              </Link>
              <Link
                href={`/${slug}/dashboard/agencies/${agency.id}/edit`}
                className="flex-1 text-center px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}

        {(!agencies || agencies.length === 0) && (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏛️</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No agencies yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first agency partnership.</p>
            <Link
              href={`/${slug}/dashboard/agencies/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Agency
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
