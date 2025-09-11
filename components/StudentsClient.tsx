"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import DropdownMenu from "@/components/ui/dropdown-menu";
import Modal from "@/components/ui/modal";
import { createStudentAction, updateStudentAction, deleteStudentAction } from "../app/[slug]/dashboard/students/actions";

interface Student {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  organization_name: string;
  linked_agencies_count: number;
  applications_count: number;
}

interface StudentsClientProps {
  students: Student[];
  total: number;
  from: number;
  to: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  baseHref: string;
  organizationSlug: string;
}

export default function StudentsClient({
  students,
  total,
  from,
  to,
  totalPages,
  currentPage,
  searchQuery,
  baseHref,
  organizationSlug
}: StudentsClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState(searchQuery);

  const handleCreate = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await createStudentAction(formData, organizationSlug);
      if (result.success) {
        setIsCreateModalOpen(false);
        window.location.reload();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Error creating student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (formData: FormData) => {
    if (!selectedStudent) return;
    
    setIsLoading(true);
    try {
      const result = await updateStudentAction(formData, organizationSlug);
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedStudent(null);
        window.location.reload();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Error updating student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (formData: FormData) => {
    if (!selectedStudent) return;
    
    setIsLoading(true);
    try {
      const result = await deleteStudentAction(formData);
      if (result.success) {
        setIsDeleteModalOpen(false);
        setSelectedStudent(null);
        window.location.reload();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Error deleting student');
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

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-black text-white';
      case 'pending':
        return 'bg-gray-100 text-gray-600';
      case 'inactive':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 mt-1">Manage student records across all organizations</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Students</h2>
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
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
                <th className="px-6 py-3 font-medium text-gray-900">Organization</th>
                <th className="px-6 py-3 font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 font-medium text-gray-900">Linked Agencies</th>
                <th className="px-6 py-3 font-medium text-gray-900">Applications</th>
                <th className="px-6 py-3 font-medium text-gray-900">Last Updated</th>
                <th className="px-6 py-3 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">No students yet</p>
                      <p className="text-gray-500 mb-4">Get started by creating your first student</p>
                    </div>
                  </td>
                </tr>
              )}
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.email || 'No email'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{student.organization_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{student.linked_agencies_count.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{student.applications_count.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {student.updated_at ? new Date(student.updated_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu
                      onEdit={() => {
                        setSelectedStudent(student);
                        setIsEditModalOpen(true);
                      }}
                      onDelete={() => {
                        setSelectedStudent(student);
                        setIsDeleteModalOpen(true);
                      }}
                      onView={() => {
                        // TODO: Implement view functionality
                        console.log('View student:', student.id);
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
                Showing {students.length ? `${from + 1}–${from + students.length}` : 0} of{" "}
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
        title="Add Student"
      >
        <form action={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="active"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {isLoading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        title="Edit Student"
      >
        {selectedStudent && (
          <form action={handleEdit} className="space-y-4">
            <input type="hidden" name="id" value={selectedStudent.id} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                defaultValue={selectedStudent.first_name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                defaultValue={selectedStudent.last_name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={selectedStudent.email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                defaultValue={selectedStudent.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedStudent(null);
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
                {isLoading ? 'Updating...' : 'Update Student'}
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
          setSelectedStudent(null);
        }}
        title="Delete Student"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{selectedStudent.first_name} {selectedStudent.last_name}</strong>? This action cannot be undone.
            </p>
            <form action={handleDelete}>
              <input type="hidden" name="id" value={selectedStudent.id} />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedStudent(null);
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
                  {isLoading ? 'Deleting...' : 'Delete Student'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </>
  );
}
