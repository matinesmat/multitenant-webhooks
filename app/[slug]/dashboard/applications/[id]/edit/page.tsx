import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { updateApplicationAction } from "../../actions";

export default async function EditApplicationPage({ 
  params 
}: { 
  params: Promise<{ slug: string; id: string }> 
}) {
  const { slug, id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  // Get application details with related data
  const { data: application } = await supabase
    .from('applications')
    .select(`
      *,
      students!inner(first_name, last_name, email),
      agencies!inner(name)
    `)
    .eq('id', id)
    .eq('org_id', organization?.id)
    .single();

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Application not found</h2>
          <p className="text-gray-600 mb-4">The application you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Link
            href={`/${slug}/dashboard/applications`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  // Get students for dropdown
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, email')
    .eq('org_id', organization?.id)
    .order('first_name');

  // Get agencies for dropdown
  const { data: agencies } = await supabase
    .from('agencies')
    .select('id, name')
    .eq('org_id', organization?.id)
    .order('name');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${slug}/dashboard/applications`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Application</h1>
          <p className="text-gray-600 mt-1">Update application information</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form action={async (formData) => {
          "use server";
          formData.append("id", id);
          const result = await updateApplicationAction(formData, slug);
          if (result.success) {
            // Redirect back to applications list
            // This will be handled by the revalidatePath in the action
          }
        }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Selection */}
            <div className="space-y-2">
              <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                Student *
              </label>
              <select
                id="student_id"
                name="student_id"
                required
                defaultValue={application.student_id}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a student</option>
                {students?.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Agency Selection */}
            <div className="space-y-2">
              <label htmlFor="agency_id" className="block text-sm font-medium text-gray-700">
                Agency *
              </label>
              <select
                id="agency_id"
                name="agency_id"
                required
                defaultValue={application.agency_id}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an agency</option>
                {agencies?.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                defaultValue={application.metadata?.position || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Software Developer Internship"
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                defaultValue={application.metadata?.company || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Tech Corp"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={application.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewing">Reviewing</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={application.notes || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about this application..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Update Application
            </button>
            <Link
              href={`/${slug}/dashboard/applications`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
