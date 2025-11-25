"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
  const [email, setEmail] = useState("bill@opticwise.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
              autoComplete="email"
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
              autoComplete="current-password"
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
        </form>
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
