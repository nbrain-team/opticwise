"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    organizationId?: string | null;
    [key: string]: unknown;
  };
  organizations: Array<{ id: string; name: string }>;
}

export function EditContactModal({ isOpen, onClose, contact, organizations }: EditContactModalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getString = (value: unknown): string => {
    return value && typeof value === 'string' ? value : "";
  };

  const getDateString = (value: unknown): string => {
    if (!value) return "";
    try {
      return new Date(value as string).toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    firstName: getString(contact.firstName),
    lastName: getString(contact.lastName),
    email: getString(contact.email),
    emailWork: getString(contact.emailWork),
    emailHome: getString(contact.emailHome),
    emailOther: getString(contact.emailOther),
    phone: getString(contact.phone),
    phoneWork: getString(contact.phoneWork),
    phoneMobile: getString(contact.phoneMobile),
    phoneHome: getString(contact.phoneHome),
    phoneOther: getString(contact.phoneOther),
    title: getString(contact.title),
    organizationId: getString(contact.organizationId),
    city: getString(contact.city),
    state: getString(contact.state),
    country: getString(contact.country),
    zipCode: getString(contact.zipCode),
    postalAddress: getString(contact.postalAddress),
    streetAddress: getString(contact.streetAddress),
    houseNumber: getString(contact.houseNumber),
    apartmentSuite: getString(contact.apartmentSuite),
    region: getString(contact.region),
    linkedInProfile: getString(contact.linkedInProfile),
    birthday: getDateString(contact.birthday),
    notes: getString(contact.notes),
    contactType: getString(contact.contactType),
    classification: getString(contact.classification),
    marketingStatus: getString(contact.marketingStatus),
    labels: getString(contact.labels),
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update contact");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#2E2E2F]">Edit Contact</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#2E2E2F] mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                >
                  <option value="">No organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#2E2E2F] mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Primary)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Work)</label>
                <input
                  type="email"
                  name="emailWork"
                  value={formData.emailWork}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Home)</label>
                <input
                  type="email"
                  name="emailHome"
                  value={formData.emailHome}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Other)</label>
                <input
                  type="email"
                  name="emailOther"
                  value={formData.emailOther}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Work)</label>
                <input
                  type="tel"
                  name="phoneWork"
                  value={formData.phoneWork}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Mobile)</label>
                <input
                  type="tel"
                  name="phoneMobile"
                  value={formData.phoneMobile}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Home)</label>
                <input
                  type="tel"
                  name="phoneHome"
                  value={formData.phoneHome}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Other)</label>
                <input
                  type="tel"
                  name="phoneOther"
                  value={formData.phoneOther}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold text-[#2E2E2F] mb-4">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                <input
                  type="text"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h3 className="text-lg font-semibold text-[#2E2E2F] mb-4">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  name="linkedInProfile"
                  value={formData.linkedInProfile}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Type</label>
                <input
                  type="text"
                  name="contactType"
                  value={formData.contactType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
                <input
                  type="text"
                  name="classification"
                  value={formData.classification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marketing Status</label>
                <input
                  type="text"
                  name="marketingStatus"
                  value={formData.marketingStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labels (comma-separated)</label>
                <input
                  type="text"
                  name="labels"
                  value={formData.labels}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-lg hover:bg-[#2d5270] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



