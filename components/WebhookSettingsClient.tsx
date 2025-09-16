"use client";

import { useState } from 'react';
import { Plus, Settings, TestTube, Eye, Edit, Trash2, Copy, Key, AlertCircle, Check, X } from 'lucide-react';
import Modal from '@/components/ui/modal';
import DropdownMenu from '@/components/ui/dropdown-menu';
import { createWebhookAction, updateWebhookAction, deleteWebhookAction, testWebhookAction } from '@/app/[slug]/dashboard/webhook-settings/actions';

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

interface WebhookSettingsClientProps {
  webhooks: WebhookSettings[];
  organizationName: string;
  slug: string;
}

export default function WebhookSettingsClient({ webhooks, organizationName, slug }: WebhookSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'configuration' | 'testing' | 'security'>('configuration');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    enabled: true,
    resources: ['students', 'agencies', 'applications'],
    events: ['insert', 'update'],
    max_retries: 3,
    backoff_multiplier: 2,
    secret_key: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedWebhook(null);
    setFormData({
      name: '',
      url: '',
      enabled: true,
      resources: ['students', 'agencies', 'applications'],
      events: ['insert', 'update'],
      max_retries: 3,
      backoff_multiplier: 2,
      secret_key: ''
    });
    setError(null);
    setSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (webhook: WebhookSettings) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      enabled: webhook.enabled,
      resources: webhook.resources,
      events: webhook.events,
      max_retries: webhook.retry_policy.max_retries,
      backoff_multiplier: webhook.retry_policy.backoff_multiplier,
      secret_key: webhook.secret_key || ''
    });
    setError(null);
    setSuccess(null);
    setIsEditModalOpen(true);
  };

  const handleTest = (webhook: WebhookSettings) => {
    setSelectedWebhook(webhook);
    setTestResult(null);
    setIsTestModalOpen(true);
  };

  const handleDelete = async (webhook: WebhookSettings) => {
    if (confirm(`Are you sure you want to delete "${webhook.name}"?`)) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('id', webhook.id);
        formData.append('org_slug', slug);
        
        const result = await deleteWebhookAction(formData, slug);
        
        if (result.success) {
          setSuccess(result.message);
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(result.error);
          setTimeout(() => setError(null), 5000);
        }
      } catch (error) {
        setError('Failed to delete webhook');
        setTimeout(() => setError(null), 5000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name || 'Webhook Configuration');
      formDataObj.append('url', formData.url);
      formDataObj.append('enabled', formData.enabled.toString());
      formDataObj.append('resources', JSON.stringify(formData.resources));
      formDataObj.append('events', JSON.stringify(formData.events));
      formDataObj.append('max_retries', formData.max_retries.toString());
      formDataObj.append('backoff_multiplier', formData.backoff_multiplier.toString());
      formDataObj.append('secret_key', formData.secret_key);
      formDataObj.append('org_slug', slug);

      let result;
      if (selectedWebhook) {
        formDataObj.append('id', selectedWebhook.id);
        result = await updateWebhookAction(formDataObj, slug);
      } else {
        result = await createWebhookAction(formDataObj, slug);
      }

      if (result.success) {
        setSuccess(result.message);
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        // Reset form after successful creation
        if (!selectedWebhook) {
          setFormData({
            name: '',
            url: '',
            enabled: true,
            resources: ['students', 'agencies', 'applications'],
            events: ['insert', 'update'],
            max_retries: 3,
            backoff_multiplier: 2,
            secret_key: ''
          });
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to save webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!formData.url) {
      setTestResult({
        success: false,
        message: 'Please enter a webhook URL first'
      });
      return;
    }
    
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`/api/webhooks/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookId: selectedWebhook?.id || 'test',
          url: formData.url,
          secret_key: formData.secret_key
        })
      });
      
      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Webhook test successful!' : 'Webhook test failed')
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test webhook'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateSecretKey = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
  };

  const samplePayload = {
    table: "students",
    event: "INSERT",
    organization_id: "org-1",
    record: {
      id: "student-123",
      name: "John Doe",
      email: "john.doe@example.com",
      created_at: new Date().toISOString()
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'configuration', label: 'Configuration' },
          { id: 'testing', label: 'Testing' },
          { id: 'security', label: 'Security' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Webhook Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {/* Webhooks List - Show single webhook configuration */}
      <div className="space-y-4">
        {webhooks.length > 0 ? (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                    <p className="text-sm text-gray-600">{webhook.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    webhook.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {webhook.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <DropdownMenu
                    onEdit={() => handleEdit(webhook)}
                    onDelete={() => handleDelete(webhook)}
                    onView={() => handleTest(webhook)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Resources</p>
                  <div className="flex flex-wrap gap-1">
                    {webhook.resources.map((resource) => (
                      <span key={resource} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Events</p>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <span key={event} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Retry Policy</p>
                  <p className="text-sm text-gray-600">
                    {webhook.retry_policy.max_retries} retries
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Created {new Date(webhook.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(webhook)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    <TestTube className="w-4 h-4" />
                    Test
                  </button>
                  <button
                    onClick={() => handleEdit(webhook)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first webhook configuration.</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Webhook
            </button>
          </div>
        )}
      </div>


      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Webhook Configuration</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Enabled</span>
              <button 
                onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.enabled ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Endpoint URL */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Endpoint URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com/webhooks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">The URL where webhook payloads will be delivered</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resources to Monitor */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Resources to Monitor</h3>
                <div className="space-y-2">
                  {['students', 'agencies', 'applications', 'agency_student'].map((resource) => (
                    <label key={resource} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.resources.includes(resource)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, resources: [...formData.resources, resource] });
                          } else {
                            setFormData({ ...formData, resources: formData.resources.filter(r => r !== resource) });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{resource.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Events to Monitor */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Events to Monitor</h3>
                <div className="space-y-2">
                  {['insert', 'update', 'delete'].map((event) => (
                    <label key={event} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, events: [...formData.events, event] });
                          } else {
                            setFormData({ ...formData, events: formData.events.filter(e => e !== event) });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Retry Attempts */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Max Retry Attempts</label>
                <select 
                  value={formData.max_retries}
                  onChange={(e) => setFormData({ ...formData, max_retries: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>

              {/* Backoff Multiplier */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Backoff Multiplier</label>
                <select 
                  value={formData.backoff_multiplier}
                  onChange={(e) => setFormData({ ...formData, backoff_multiplier: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={5}>5x</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button 
                type="button"
                onClick={() => setFormData({
                  name: '',
                  url: '',
                  enabled: true,
                  resources: ['students', 'agencies', 'applications'],
                  events: ['insert', 'update'],
                  max_retries: 3,
                  backoff_multiplier: 2,
                  secret_key: ''
                })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Testing Tab */}
      {activeTab === 'testing' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Webhook Delivery</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Send a test webhook to verify your endpoint is working correctly.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Test Endpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Test Endpoint</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com/webhooks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sample Payload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Sample Payload</label>
              <textarea
                value={JSON.stringify(samplePayload, null, 2)}
                readOnly
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-sm"
              />
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-md ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex">
                  {testResult.success ? (
                    <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Send Test Button */}
            <button
              onClick={handleTestWebhook}
              disabled={loading || !formData.url}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              {loading ? 'Sending Test...' : 'Send Test Webhook'}
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Webhook Security</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Signing Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Signing Secret</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={formData.secret_key || '••••••••••••••••'}
                  onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                  placeholder="Enter or generate a secret key"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(formData.secret_key || '')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  title="Copy secret"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newSecret = generateSecretKey();
                    setFormData({ ...formData, secret_key: newSecret });
                    copyToClipboard(newSecret);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  title="Generate new secret"
                >
                  <Key className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Use this secret to verify webhook authenticity using HMAC SHA-256
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-3">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Always verify webhook signatures in your application to ensure the request is coming from our system.
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Verification */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Signature Verification</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Header: X-Signature</p>
                <p>Algorithm: sha256(payload + secret)</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, secret_key: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Help Icon */}
      <div className="fixed bottom-6 right-6">
        <button className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700">
          ?
        </button>
      </div>

      {/* Create/Edit Webhook Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={selectedWebhook ? 'Edit Webhook' : 'Create Webhook'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resources to Monitor</label>
            <div className="space-y-2">
              {['students', 'agencies', 'applications', 'agency_student'].map((resource) => (
                <label key={resource} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.resources.includes(resource)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, resources: [...formData.resources, resource] });
                      } else {
                        setFormData({ ...formData, resources: formData.resources.filter(r => r !== resource) });
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{resource.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Events to Monitor</label>
            <div className="space-y-2">
              {['insert', 'update', 'delete'].map((event) => (
                <label key={event} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, events: [...formData.events, event] });
                      } else {
                        setFormData({ ...formData, events: formData.events.filter(e => e !== event) });
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries</label>
              <select
                value={formData.max_retries}
                onChange={(e) => setFormData({ ...formData, max_retries: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backoff Multiplier</label>
              <select
                value={formData.backoff_multiplier}
                onChange={(e) => setFormData({ ...formData, backoff_multiplier: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={5}>5x</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable webhook</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (selectedWebhook ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Test Webhook Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Test Webhook"
      >
        {selectedWebhook && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Endpoint</label>
              <input
                type="url"
                value={selectedWebhook.url}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Payload</label>
              <textarea
                value={JSON.stringify(samplePayload, null, 2)}
                readOnly
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-sm"
              />
            </div>

            {testResult && (
              <div className={`p-4 rounded-md ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex">
                  {testResult.success ? (
                    <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleTestWebhook}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
