"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { saveSubscription } from "@/lib/firebase/data";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!email.trim()) {
      setStatus("Enter an email first.");
      return;
    }

    try {
      await saveSubscription(email);
      setStatus("Subscribed successfully.");
      setEmail("");
    } catch {
      setStatus("Subscription failed. Try again.");
    }
  }

  return (
    <footer className="footer" id="subscribe">
      <div className="footer-inner">
        <div>
          <div className="logo">
            <div className="logo-mark">
              <span className="logo-e">E</span>
            </div>
            <div className="logo-text">
              <span className="l1">Engineer</span>
              <span className="l2">
                With <span className="m">Me</span>
              </span>
            </div>
          </div>
          <p className="muted">Real Build. Real Code. Real Engineering.</p>
        </div>

        <div>
          <h4>Foundations</h4>
          <ul>
            <li>Science</li>
            <li>Mathematics</li>
            <li>Mechanical</li>
            <li>Electronics</li>
          </ul>
        </div>

        <div>
          <h4>Pages</h4>
          <ul>
            <li>
              <Link href="/pages/terms-and-conditions">Terms and Conditions</Link>
            </li>
            <li>
              <Link href="/pages/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/pages/about">About</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Newsletter</h4>
          <form className="subscription-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
            {status ? <span className="muted">{status}</span> : null}
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <span>Ã‚Â© 2026 Engineer With Me</span>
        <span>PWA enabled Ã¢â‚¬Â¢ Firebase powered</span>
      </div>
    </footer>
  );
}
