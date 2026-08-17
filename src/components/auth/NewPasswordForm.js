"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export function NewPasswordForm({ onSubmit, loading, error }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = () => {
    setLocalError("");
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setLocalError("Passwords don't match");
      return;
    }
    onSubmit(password);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-bold text-plum">Set a new password</h3>
        <p className="mt-1 text-sm text-muted">
          Choose a strong password you don't use anywhere else.
        </p>
      </div>

      {(error || localError) && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error || localError}</span>
        </div>
      )}

      <div>
        <label className="label-text mb-1.5 text-sm font-semibold">New password</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            className="input input-bordered w-full pr-11"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-plum"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="label-text mb-1.5 text-sm font-semibold">Confirm new password</label>
        <input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          className="input input-bordered w-full"
          placeholder="Repeat your new password"
        />
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}