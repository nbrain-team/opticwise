'use client';

import { useState } from 'react';
import Link from 'next/link';

type BookRequestResult = {
  success: boolean;
  bookRequest: {
    id: string;
    type: string;
  };
  downloadLink: string | null;
  message: string;
};

export default function BookRequestPage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookRequestResult | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    phone: '',
    type: 'digital',
    format: 'pdf',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: 'USA',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/book-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          name: `${formData.firstName} ${formData.lastName}`,
          source: 'website',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit book request');
      }

      const data = await response.json();
      setResult(data);
      setStep('success');
    } catch (error) {
      console.error('Error submitting book request:', error);
      alert('Failed to submit book request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Book Request Confirmed!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {result?.message}
            </p>

            {result?.downloadLink && (
              <div className="mb-8">
                <a
                  href={result.downloadLink}
                  className="inline-block bg-[#3B6B8F] text-white px-8 py-4 rounded-lg hover:bg-[#2E5570] transition-colors font-semibold text-lg"
                >
                  📥 Download Your Book Now
                </a>
              </div>
            )}

            {formData.type === 'physical' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">📦 Shipping Information</h3>
                <p className="text-sm text-blue-800">
                  Your book will be shipped to:<br />
                  {formData.shippingAddress}<br />
                  {formData.shippingCity}, {formData.shippingState} {formData.shippingZip}<br />
                  {formData.shippingCountry}
                </p>
                <p className="text-sm text-blue-800 mt-4">
                  Expected delivery: 3-5 business days
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-gray-600">
                We&apos;ll send you an email with additional resources and information about OpticWise.
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/"
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  Return to Homepage
                </Link>
                <Link
                  href="/audit-tool"
                  className="px-6 py-3 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
                >
                  Get Free Infrastructure Audit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#3B6B8F] rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Your Free Book
          </h1>
          <p className="text-xl text-gray-600">
            &quot;Who Owns Your Data?&quot; - The Essential Guide to Commercial Real Estate Digital Infrastructure
          </p>
        </div>

        {/* Book Benefits */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">What You&apos;ll Learn:</h3>
          <ul className="text-blue-800 space-y-2">
            <li>✓ How to take control of your building&apos;s digital infrastructure</li>
            <li>✓ Save 10%+ on utility costs through system consolidation</li>
            <li>✓ Generate $6-12 per door in recurring revenue</li>
            <li>✓ Avoid vendor lock-in and reduce operational complexity</li>
            <li>✓ Real-world case studies from property owners</li>
          </ul>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Book Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you like to receive your book? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'digital' })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.type === 'digital'
                      ? 'border-[#3B6B8F] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">💻</div>
                  <div className="font-semibold text-gray-900">Digital</div>
                  <div className="text-sm text-gray-600">Instant download</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'physical' })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.type === 'physical'
                      ? 'border-[#3B6B8F] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">📦</div>
                  <div className="font-semibold text-gray-900">Physical</div>
                  <div className="text-sm text-gray-600">Ships in 3-5 days</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'both' })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.type === 'both'
                      ? 'border-[#3B6B8F] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🎁</div>
                  <div className="font-semibold text-gray-900">Both</div>
                  <div className="text-sm text-gray-600">Best value</div>
                </button>
              </div>
            </div>

            {/* Digital Format */}
            {(formData.type === 'digital' || formData.type === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="epub">EPUB</option>
                  <option value="kindle">Kindle</option>
                </select>
              </div>
            )}

            {/* Contact Information */}
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Shipping Address (if physical) */}
            {(formData.type === 'physical' || formData.type === 'both') && (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shippingCity}
                      onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shippingState}
                      onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shippingZip}
                      onChange={(e) => setFormData({ ...formData, shippingZip: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shippingCountry}
                      onChange={(e) => setFormData({ ...formData, shippingCountry: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3B6B8F] text-white px-8 py-4 rounded-lg hover:bg-[#2E5570] transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Get My Free Book →'}
            </button>
          </form>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🔒 Your information is secure and will never be shared</p>
          <p className="mt-2">📧 We&apos;ll send you helpful resources about digital infrastructure</p>
        </div>
      </div>
    </div>
  );
}

