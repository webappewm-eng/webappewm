"use client";

import { useEffect, useState } from "react";
import { getNotifications } from "@/lib/firebase/data";

export function NotificationStrip() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLatest() {
      const rows = await getNotifications();
      if (!rows.length) {
        return;
      }

      const latest = rows[0];
      setMessage(`${latest.title}: ${latest.message}`);
    }

    void loadLatest();
  }, []);

  if (!message) {
    return null;
  }

  return (
    <div className="notice" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}>
      <strong>Update:</strong> {message}
    </div>
  );
}
