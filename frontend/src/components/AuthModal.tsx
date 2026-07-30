import React, { useState } from "react";
import { Eye, EyeOff, Lock, X } from "lucide-react";
import type { AuthMode, AuthPayload } from "../types";

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
  onSubmit: (payload: AuthPayload) => Promise<void>;
}

export function AuthModal({ mode, onClose, onSwitchMode, onSubmit }: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignup && !name.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    if (password.length < 8) return setError("Password needs at least 8 characters.");

    setSubmitting(true);
    try {
      await onSubmit({
        mode,
        name: isSignup ? name.trim() : undefined,
        email: email.trim(),
        password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aa-modal-overlay" onMouseDown={onClose}>
      <div className="aa-modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <button className="aa-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="aa-mark" style={{ marginBottom: 14 }}>
          α
        </div>
        <h2 className="aa-modal-title">{isSignup ? "Create your account" : "Welcome back"}</h2>
        <p className="aa-modal-sub">
          {isSignup
            ? "Save every question, pick up conversations later, and unlock the full AlphaAsk toolkit."
            : "Log in to pick up where you left off."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <label className="aa-field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ama Owusu"
                autoComplete="name"
              />
            </label>
          )}

          <label className="aa-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              autoComplete="email"
            />
          </label>

          <label className="aa-field">
            <span>Password</span>
            <div className="aa-password-wrap">
              <Lock size={14} className="aa-muted-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="aa-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="aa-form-error">
              {error}
              {error.includes("already registered") && (
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--aa-accent)", textDecoration: "underline", cursor: "pointer", marginLeft: 6, fontWeight: 600 }}
                  onClick={() => onSwitchMode("login")}
                >
                  Log in instead?
                </button>
              )}
            </div>
          )}

          <button type="submit" className="aa-btn aa-btn-primary aa-modal-submit" disabled={submitting}>
            {submitting ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <div className="aa-modal-switch">
          {isSignup ? (
            <>
              Already have an account? <button onClick={() => onSwitchMode("login")}>Log in</button>
            </>
          ) : (
            <>
              New to AlphaAsk? <button onClick={() => onSwitchMode("signup")}>Sign up</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
