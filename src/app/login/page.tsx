"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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

      // Hard navigation to ensure browser sends new session cookie
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-vault-950 via-vault-950 to-cyan-accent/[0.03] p-4">
      <div className="w-full max-w-[400px] animate-fade-in-scale">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/logo.png" alt="SkyDeck" className="h-28 w-28 object-contain" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-vault-100">
              SkyDeck
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-vault-500">
              Cloud Portal
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-vault-200">Sign in</h2>
            <p className="mt-1 text-sm text-vault-500">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-vault-400"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="skydeck-email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@skydeck.io"
                required
                className="w-full rounded-xl border border-vault-800/60 bg-vault-950/60 px-4 py-2.5 text-sm text-vault-200 placeholder-vault-600 outline-none ring-1 ring-transparent transition-all duration-300 focus:border-cyan-accent/30 focus:ring-cyan-accent/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-vault-400"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="skydeck-password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-vault-800/60 bg-vault-950/60 px-4 py-2.5 text-sm text-vault-200 placeholder-vault-600 outline-none ring-1 ring-transparent transition-all duration-300 focus:border-cyan-accent/30 focus:ring-cyan-accent/20"
              />
            </div>

            {error && (
              <div className="animate-fade-in flex items-center gap-2 rounded-xl bg-rose-accent/5 px-4 py-3 text-sm text-rose-accent ring-1 ring-rose-accent/15">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-accent/20 transition-all duration-300 hover:bg-cyan-accent/90 hover:shadow-xl hover:shadow-cyan-accent/25 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-vault-600">
            Demo: admin@skydeck.io / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
