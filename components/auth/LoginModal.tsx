"use client";

import { FormEvent, useState } from "react";
import { loginWithEmail, registerWithEmail } from "@/lib/firebase/auth";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onClose();
      setEmail("");
      setPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Login"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{mode === "login" ? "Login to Unlock Full Content" : "Create Your Account"}</h3>
        <p>Free preview is capped at 20%. Sign in to continue reading full posts and submit feedback.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          {error ? <div className="notice">{error}</div> : null}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>

        <div style={{ marginTop: "0.7rem" }}>
          <button
            type="button"
            className="nav-link"
            onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
            style={{ border: 0, background: "transparent", cursor: "pointer" }}
          >
            {mode === "login" ? "New here? Create account" : "Already have account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
