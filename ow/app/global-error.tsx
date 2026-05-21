"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f9fafb",
        }}
      >
        <header
          style={{
            borderBottom: "1px solid #e5e7eb",
            background: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 24px",
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <a href="/dashboard" style={{ fontWeight: 700, color: "#50555C", textDecoration: "none", fontSize: 18 }}>
              OpticWise
            </a>
            <button
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" })
                  .finally(() => { window.location.href = "/login" })
              }}
              style={{
                fontSize: 14,
                border: "1px solid #d1d5db",
                borderRadius: 9999,
                padding: "6px 16px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <main
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 10rem)",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                fontSize: 28,
              }}
            >
              !
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
              An unexpected error occurred. You can try again or use the logout
              button above to sign out.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "10px 20px",
                  background: "#3B6B8F",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Try Again
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
