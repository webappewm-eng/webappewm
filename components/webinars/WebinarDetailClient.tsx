"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { registerWebinar } from "@/lib/firebase/data";
import { Webinar } from "@/lib/types";

interface WebinarDetailClientProps {
  webinar: Webinar;
}

export function WebinarDetailClient({ webinar }: WebinarDetailClientProps) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.email?.split("@")[0] ?? "");
  const [status, setStatus] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!user?.uid || !user.email) {
      setStatus("Please login first to register.");
      setLoginOpen(true);
      return;
    }

    try {
      await registerWebinar({
        webinarId: webinar.id,
        userId: user.uid,
        userEmail: user.email,
        userName: name.trim() || user.email.split("@")[0]
      });
      setStatus("Registration completed. Check your email for updates.");
    } catch {
      setStatus("Could not register right now. Please retry.");
    }
  }

  return (
    <>
      <section className="post-content" style={{ marginTop: "1rem" }}>
        <div className="post-content-inner">
          <div className="label">Webinar Registration</div>
          <h2 className="h2" style={{ marginTop: "0.4rem" }}>
            Reserve your seat
          </h2>
          <form className="form-grid" onSubmit={handleRegister}>
            <input
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit">
              Register Now
            </button>
            {status ? <div className="notice">{status}</div> : null}
          </form>

          <div className="form-actions" style={{ marginTop: "0.9rem" }}>
            <a href={webinar.meetingUrl} className="btn btn-outline" target="_blank" rel="noreferrer">
              Open Meeting Link
            </a>
            <Link href="/webinars" className="btn btn-outline">
              All Webinars
            </Link>
          </div>

          <p className="muted" style={{ marginTop: "0.9rem" }}>
            Shortcode for posts: <strong>{webinar.shortcode}</strong>
          </p>
        </div>
      </section>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
