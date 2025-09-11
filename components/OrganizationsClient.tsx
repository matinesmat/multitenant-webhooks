"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import DropdownMenu from "@/components/ui/dropdown-menu";
import Modal from "@/components/ui/modal";
import { createOrganizationAction, updateOrganizationAction, deleteOrganizationAction } from "../app/[slug]/dashboard/organizations/actions";

interface Org {
  id: string;
  name: string;
  owner_id: string | null;
  owner_email: string | null;
  slug: string;
  created_at: string;
  students_count: number;
  agencies_count: number;
  status: 'active' | 'pending';
}

interface OrganizationsClientProps {
  organizations: Org[];
  total: number;
  from: number;
  to: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  baseHref: string;
}

export default function OrganizationsClient({
  organizations,
  total,
  from,
  to,
  totalPages,
  currentPage,
  searchQuery,
  baseHref
}: OrganizationsClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState(searchQuery);

  const handleCreate = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await createOrganizationAction(formData);
      if (result.success) {
        setIsCreateModalOpen(false);
        window.location.reload();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Error creating organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (formData: FormData) => {
    if (!selectedOrg) return;
    
    setIsLoading(true);
    try {
      const result = await updateOrganizationAction(formData);
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedOrg(null);
        window.location.reload();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Error updating organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (formData: FormData) => {
    if (!selectedOrg) return;
    
    setIsLoading(true);
    try {
      const result = await deleteOrganizationAction(formData);
      if (result.success) {
        setIsDeleteModalOpen(false);
        setSelectedOrg(null);
        window.location.reload();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Error deleting organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (searchValue) {
      url.searchParams.set('search', searchValue);
    } else {
      url.searchParams.delete('search');
    }
    window.location.href = url.toString();
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
            <p className="text-gray-600 mt-1">Manage your multitenant organizations</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Organization
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Organizations</h2>
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900">Name</th>
                <th className="px-6 py-3 font-medium text-gray-900">Owner</th>
                <th className="px-6 py-3 font-medium text-gray-900">Students</th>
                <th className="px-6 py-3 font-medium text-gray-900">Agencies</th>
                <th className="px-6 py-3 font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 font-medium text-gray-900">Created</th>
                <th className="px-6 py-3 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organizations.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">No organizations yet</p>
                      <p className="text-gray-500 mb-4">Get started by creating your first organization</p>
                    </div>
                  </td>
                </tr>
              )}
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{org.name}</div>
                      <div className="text-sm text-gray-500">{org.owner_email || 'No email'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {org.owner_id ? 'Owner' : 'No owner'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{org.students_count.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{org.agencies_count.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      org.status === 'active' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {org.status}
                    </span>
                  </td>
                   <td className="px-6 py-4">
                     <div className="text-sm text-gray-900">
                       {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'Recently'}
                     </div>
                   </td>
                  <td className="px-6 py-4">
                    <DropdownMenu
                      onEdit={() => {
                        setSelectedOrg(org);
                        setIsEditModalOpen(true);
                      }}
                      onDelete={() => {
                        setSelectedOrg(org);
                        setIsDeleteModalOpen(true);
                      }}
                      onView={() => {
                        // TODO: Implement view functionality
                        console.log('View organization:', org.id);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <div>
                Showing {organizations.length ? `${from + 1}–${from + organizations.length}` : 0} of{" "}
                {total.toLocaleString()} entries
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`${baseHref}?page=${Math.max(1, currentPage - 1)}`}
                  className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50 transition-colors"
                >
                  &lt;
                </a>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <a
                    key={page}
                    href={`${baseHref}?page=${page}`}
                    className={`h-8 rounded-md px-3 text-sm transition-colors ${
                      page === currentPage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </a>
                ))}
                <a
                  href={`${baseHref}?page=${Math.min(totalPages, currentPage + 1)}`}
                  className="h-8 rounded-md border bg-white px-3 text-sm hover:bg-gray-50 transition-colors"
                >
                  &gt;
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Organization"
      >
        <form action={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter organization name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Email
            </label>
            <input
              type="email"
              name="owner_email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter owner email"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-black rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOrg(null);
        }}
        title="Edit Organization"
      >
        {selectedOrg && (
          <form action={handleEdit} className="space-y-4">
            <input type="hidden" name="id" value={selectedOrg.id} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={selectedOrg.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter organization name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Email
              </label>
              <input
                type="email"
                name="owner_email"
                defaultValue={selectedOrg.owner_email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter owner email"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedOrg(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm text-white bg-black rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Organization'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedOrg(null);
        }}
        title="Delete Organization"
      >
        {selectedOrg && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{selectedOrg.name}</strong>? This action cannot be undone.
            </p>
            <form action={handleDelete}>
              <input type="hidden" name="id" value={selectedOrg.id} />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedOrg(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete Organization'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </>
  );
}
