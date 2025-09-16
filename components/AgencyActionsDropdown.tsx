"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { deleteAgencyAction } from "@/app/[slug]/dashboard/agencies/actions";

interface AgencyActionsDropdownProps {
  agencyId: string;
  slug: string;
}

export default function AgencyActionsDropdown({ agencyId, slug }: AgencyActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this agency? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        const result = await deleteAgencyAction(agencyId);
        if (result.success) {
          // The page will be revalidated by the action
          window.location.reload();
        } else {
          alert(`Failed to delete agency: ${result.error}`);
        }
      } catch (error) {
        alert(`Error deleting agency: ${error}`);
      } finally {
        setIsDeleting(false);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        disabled={isDeleting}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <Link
              href={`/${slug}/dashboard/agencies/${agencyId}`}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Eye className="w-4 h-4 mr-3 text-gray-400" />
              View Details
            </Link>
            <Link
              href={`/${slug}/dashboard/agencies/${agencyId}/edit`}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Edit className="w-4 h-4 mr-3 text-gray-400" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 mr-3 text-red-500" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
