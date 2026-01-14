"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: {
    id: string;
    title: string;
    stageId: string;
    pipelineId?: string;
    [key: string]: unknown;
  };
  stages: Array<{ id: string; name: string }>;
  organizations: Array<{ id: string; name: string }>;
  people: Array<{ id: string; firstName: string; lastName: string }>;
}

export function EditDealModal({ isOpen, onClose, deal, stages, organizations, people }: EditDealModalProps) {
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
    title: deal.title,
    value: getString(deal.value),
    currency: getString(deal.currency) || "USD",
    status: getString(deal.status) || "open",
    probability: getString(deal.probability),
    expectedCloseDate: getDateString(deal.expectedCloseDate),
    stageId: deal.stageId,
    organizationId: getString(deal.organizationId),
    personId: getString(deal.personId),
    label: getString(deal.label) || getString(deal.labels),
    propertyType: getString(deal.propertyType),
    propertyAddress: getString(deal.propertyAddress),
    qty: getString(deal.qty),
    goLiveTarget: getString(deal.goLiveTarget),
    arrForecast: getString(deal.arrForecast),
    capexRom: getString(deal.capexRom),
    mrr: getString(deal.mrr),
    arr: getString(deal.arr),
    acv: getString(deal.acv),
    auditValue: getString(deal.auditValue),
    arrExpansionPotential: getString(deal.arrExpansionPotential),
    leadSource: getString(deal.leadSource),
    technicalPOC: getString(deal.technicalPOC),
    icpSegment: getString(deal.icpSegment),
    readinessScore: getString(deal.readinessScore),
    ddiAuditStatus: getString(deal.ddiAuditStatus),
    lostReason: getString(deal.lostReason),
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update deal");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#2E2E2F]">Edit Deal</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#2E2E2F] mb-4">Basic Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="probability"
                  value={formData.probability}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  name="stageId"
                  value={formData.stageId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                >
                  {stages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                <input
                  type="date"
                  name="expectedCloseDate"
                  value={formData.expectedCloseDate}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <select
                  name="personId"
                  value={formData.personId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                >
                  <option value="">No contact person</option>
                  {people.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h3 className="text-lg font-semibold text-[#2E2E2F] mb-4">Property Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <input
                  type="text"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (units, beds, sqft)</label>
                <input
                  type="text"
                  name="qty"
                  value={formData.qty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                <input
                  type="text"
                  name="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Go-Live Target</label>
                <input
                  type="text"
                  name="goLiveTarget"
                  value={formData.goLiveTarget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h3 className="text-lg font-semibold text-[#2E2E2F] mb-4">Financial Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ARR Forecast</label>
                <input
                  type="number"
                  step="0.01"
                  name="arrForecast"
                  value={formData.arrForecast}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CapEx ROM</label>
                <input
                  type="number"
                  step="0.01"
                  name="capexRom"
                  value={formData.capexRom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MRR</label>
                <input
                  type="number"
                  step="0.01"
                  name="mrr"
                  value={formData.mrr}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ARR</label>
                <input
                  type="number"
                  step="0.01"
                  name="arr"
                  value={formData.arr}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ACV</label>
                <input
                  type="number"
                  step="0.01"
                  name="acv"
                  value={formData.acv}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audit Value</label>
                <input
                  type="number"
                  step="0.01"
                  name="auditValue"
                  value={formData.auditValue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ARR Expansion Potential</label>
                <input
                  type="number"
                  step="0.01"
                  name="arrExpansionPotential"
                  value={formData.arrExpansionPotential}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sales & Qualification */}
          <div>
            <h3 className="text-lg font-semibold text-[#2E2E2F] mb-4">Sales & Qualification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                <input
                  type="text"
                  name="leadSource"
                  value={formData.leadSource}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technical POC</label>
                <input
                  type="text"
                  name="technicalPOC"
                  value={formData.technicalPOC}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICP Segment</label>
                <input
                  type="text"
                  name="icpSegment"
                  value={formData.icpSegment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Readiness Score</label>
                <input
                  type="text"
                  name="readinessScore"
                  value={formData.readinessScore}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DDI Audit Status</label>
                <input
                  type="text"
                  name="ddiAuditStatus"
                  value={formData.ddiAuditStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Lost Reason (if status is lost) */}
          {formData.status === 'lost' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lost Reason</label>
              <textarea
                name="lostReason"
                value={formData.lostReason}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
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





