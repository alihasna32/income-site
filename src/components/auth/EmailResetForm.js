"use client";

import { Loader2, Mail, Send } from "lucide-react";

export function EmailResetForm({ email, onEmailChange, onSubmit, loading, error, autoFocus }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-bold text-plum">Reset your password</h3>
        <p className="mt-1 text-sm text-muted">
          We'll send a 6-digit code to your email. It expires in 10 minutes.
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
        </div>
      )}

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          autoFocus={autoFocus}
          autoComplete="email"
          inputMode="email"
          className="input input-bordered w-full"
          placeholder="you@example.com"
        />
      </label>

      <button type="submit" className="btn btn-primary w-full" disabled={loading || !email.trim()}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {loading ? "Sending code…" : "Continue"}
      </button>
    </form>
  );
}