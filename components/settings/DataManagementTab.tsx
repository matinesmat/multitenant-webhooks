"use client";

import { useState } from "react";
import { Database, Download, Trash2, AlertTriangle } from "lucide-react";

interface DataManagementTabProps {
  user: any;
}

export default function DataManagementTab({ user }: DataManagementTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      alert('Data export started. You will receive an email when it\'s ready.');
    }, 2000);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    );
    
    if (confirmed) {
      setIsDeleting(true);
      // Simulate deletion process
      setTimeout(() => {
        setIsDeleting(false);
        alert('Account deletion request submitted. You will receive a confirmation email.');
      }, 2000);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
      </div>

      <div className="space-y-6">
        {/* Data Export */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Export Your Data</h3>
              <p className="text-sm text-blue-700 mt-1">
                Download a copy of all your data including profile information, settings, and activity logs.
              </p>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Preparing Export...' : 'Export Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Data Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Your Data</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Profile Information</span>
              <span className="text-gray-900">Stored</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Notification Preferences</span>
              <span className="text-gray-900">Stored</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Activity Logs</span>
              <span className="text-gray-900">Stored</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Account Created</span>
              <span className="text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-900">Data Retention Policy</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your data is retained for 1 year after account deletion. After this period, all personal data will be permanently removed from our systems.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Processing...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
