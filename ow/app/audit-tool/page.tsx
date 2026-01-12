'use client';

import { useState } from 'react';
import Link from 'next/link';

type Step = 'welcome' | 'property-type' | 'size' | 'systems' | 'pain-points' | 'contact' | 'results';

export default function AuditToolPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    phone: '',
    propertyType: '',
    propertySize: '',
    numberOfUnits: '',
    independentSystems: '',
    physicalNetworks: '',
    currentVendors: '',
    painPoints: '',
    decisionMaker: false,
    budget: '',
    timeline: '',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/audit-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          numberOfUnits: formData.numberOfUnits ? parseInt(formData.numberOfUnits) : null,
          independentSystems: formData.independentSystems ? parseInt(formData.independentSystems) : null,
          physicalNetworks: formData.physicalNetworks ? parseInt(formData.physicalNetworks) : null,
          source: 'website',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit audit request');
      }

      const data = await response.json();
      setResults(data);
      setStep('results');
    } catch (error) {
      console.error('Error submitting audit:', error);
      alert('Failed to submit audit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-[#3B6B8F] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">📋</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Free Digital Infrastructure Audit
              </h1>
              <p className="text-xl text-gray-600">
                Discover how much you could save and earn with optimized building systems
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-3">What You'll Get:</h3>
              <ul className="text-left text-blue-800 space-y-2">
                <li>✓ Detailed analysis of your current infrastructure</li>
                <li>✓ Potential savings estimate (typically 10%+ on utilities)</li>
                <li>✓ Revenue opportunities ($6-12 per door/month)</li>
                <li>✓ Free 1-hour consultation with our experts</li>
              </ul>
            </div>

            <button
              onClick={() => setStep('property-type')}
              className="bg-[#3B6B8F] text-white px-8 py-4 rounded-lg hover:bg-[#2E5570] transition-colors font-semibold text-lg"
            >
              Start Your Free Audit →
            </button>

            <p className="mt-4 text-sm text-gray-500">Takes only 2-3 minutes</p>
          </div>
        );

      case 'property-type':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-2">Question 1 of 5</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What type of property do you manage?
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { value: 'office', label: 'Office Building', icon: '🏢' },
                { value: 'apartment', label: 'Apartment/Multifamily', icon: '🏘️' },
                { value: 'hospitality', label: 'Hotel/Hospitality', icon: '🏨' },
                { value: 'mixed-use', label: 'Mixed-Use', icon: '🏙️' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFormData({ ...formData, propertyType: option.value });
                    setStep('size');
                  }}
                  className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-[#3B6B8F] hover:bg-blue-50 transition-colors text-left flex items-center space-x-4"
                >
                  <span className="text-4xl">{option.icon}</span>
                  <span className="text-lg font-medium text-gray-900">{option.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('welcome')}
              className="mt-6 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        );

      case 'size':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-2">Question 2 of 5</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How large is your property?
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Units (if applicable)
                </label>
                <input
                  type="number"
                  value={formData.numberOfUnits}
                  onChange={(e) => setFormData({ ...formData, numberOfUnits: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="e.g., 250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Square Footage (optional)
                </label>
                <input
                  type="text"
                  value={formData.propertySize}
                  onChange={(e) => setFormData({ ...formData, propertySize: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="e.g., 150,000 sq ft"
                />
              </div>

              <button
                onClick={() => setStep('systems')}
                className="w-full bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
              >
                Continue →
              </button>
            </div>

            <button
              onClick={() => setStep('property-type')}
              className="mt-6 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        );

      case 'systems':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-2">Question 3 of 5</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Tell us about your building systems
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many independent systems do you have?
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  (HVAC, Access Control, Security, Lighting, etc.)
                </p>
                <input
                  type="number"
                  value={formData.independentSystems}
                  onChange={(e) => setFormData({ ...formData, independentSystems: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many physical networks?
                </label>
                <input
                  type="number"
                  value={formData.physicalNetworks}
                  onChange={(e) => setFormData({ ...formData, physicalNetworks: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="e.g., 3"
                />
              </div>

              <button
                onClick={() => setStep('pain-points')}
                className="w-full bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
              >
                Continue →
              </button>
            </div>

            <button
              onClick={() => setStep('size')}
              className="mt-6 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        );

      case 'pain-points':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-2">Question 4 of 5</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What are your current pain points?
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <textarea
                  rows={5}
                  value={formData.painPoints}
                  onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  placeholder="Tell us about your challenges with building systems, vendors, costs, etc..."
                />
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="decisionMaker"
                  checked={formData.decisionMaker}
                  onChange={(e) => setFormData({ ...formData, decisionMaker: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="decisionMaker" className="text-sm text-gray-700">
                  I am the decision maker for infrastructure decisions
                </label>
              </div>

              <button
                onClick={() => setStep('contact')}
                className="w-full bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
              >
                Continue →
              </button>
            </div>

            <button
              onClick={() => setStep('systems')}
              className="mt-6 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        );

      case 'contact':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-2">Question 5 of 5</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How can we reach you with your results?
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !formData.email || !formData.firstName || !formData.lastName}
                className="w-full bg-[#3B6B8F] text-white px-6 py-3 rounded-lg hover:bg-[#2E5570] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Get My Free Audit Results →'}
              </button>
            </div>

            <button
              onClick={() => setStep('pain-points')}
              className="mt-6 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        );

      case 'results':
        return (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">✓</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Infrastructure Audit Results
              </h1>
              <p className="text-gray-600">
                Based on your responses, we've identified several opportunities
              </p>
            </div>

            {/* Lead Score */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-900">Infrastructure Optimization Score</span>
                <span className="text-2xl font-bold text-blue-900">{results?.auditRequest?.score}/100</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${results?.auditRequest?.score || 0}%` }}
                />
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-4 mb-8">
              {results?.insights?.map((insight: any, index: number) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      insight.potentialSavings === 'Very High' ? 'bg-green-100 text-green-800' :
                      insight.potentialSavings === 'High' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {insight.potentialSavings} Potential
                    </span>
                  </div>
                  <p className="text-gray-600">{insight.description}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="bg-[#3B6B8F] text-white rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Optimize Your Infrastructure?</h2>
              <p className="mb-6">
                Book a free 1-hour consultation with our experts to discuss your specific needs and opportunities.
              </p>
              <a
                href={results?.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-[#3B6B8F] px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Schedule Your Free Consultation →
              </a>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Return to Homepage
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {renderStep()}
      </div>
    </div>
  );
}

