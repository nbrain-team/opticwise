"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/deals";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }
      setResetSuccess(true);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
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
          <h1 className="text-3xl font-light text-[#50555C]" style={{fontFamily: 'var(--font-display)'}}>
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to access your CRM</p>
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
            <label className="block text-sm font-medium text-[#2E2E2F]">Email</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2E2E2F]">Password</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="off"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => {
                setShowResetModal(true);
                setResetEmail(email);
              }}
              className="text-sm text-[#3B6B8F] hover:text-[#2E5570] font-medium"
            >
              Forgot password?
            </button>
          </div>
        </form>

        {/* Password Reset Modal */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              {resetSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Check Your Email</h3>
                  <p className="text-gray-600 mb-6">
                    If an account exists with <strong>{resetEmail}</strong>, you will receive a password reset link shortly.
                  </p>
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetSuccess(false);
                      setResetEmail("");
                    }}
                    className="w-full btn-primary py-2.5"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Reset Password</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  {resetError && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {resetError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                        placeholder="you@opticwise.com"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetModal(false);
                          setResetError(null);
                          setResetEmail("");
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        disabled={resetLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 btn-primary py-2.5 disabled:opacity-50"
                      >
                        {resetLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
