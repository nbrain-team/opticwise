"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image
              src="/opticwise-logo.png"
              alt="Opticwise"
              width={220}
              height={66}
              className="mx-auto mb-6"
            />
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">Check Your Email</h1>
            <p className="text-gray-600 mb-2">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link to that address.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The link will expire in 1 hour. Be sure to check your spam folder if you don&apos;t see it shortly.
            </p>
            <Link
              href="/login"
              className="inline-block text-[#3B6B8F] hover:text-[#2E5570] font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/opticwise-logo.png"
            alt="Opticwise"
            width={220}
            height={66}
            className="mx-auto mb-6"
          />
          <h1 className="text-3xl font-light text-[#50555C]" style={{ fontFamily: 'var(--font-display)' }}>
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-5 bg-white p-8 rounded-xl shadow-lg border border-gray-200"
        >
          {error ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="forgot-email" className="block text-sm font-medium text-[#2E2E2F]">Email</label>
            <input
              id="forgot-email"
              name="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </button>

          <div className="text-center pt-4">
            <Link
              href="/login"
              className="text-sm text-[#3B6B8F] hover:text-[#2E5570] font-medium"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
