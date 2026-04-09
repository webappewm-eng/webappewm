"use client";

import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile as updateAuthProfile } from "firebase/auth";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { openCertificatePrint } from "@/lib/certificates/print";
import { auth } from "@/lib/firebase/client";
import {
  getCertificateTemplates,
  getCourses,
  getCurrentUserProfile,
  getUserCertificates,
  getUserCourseProgressList,
  updateCurrentUserProfile
} from "@/lib/firebase/data";
import { CertificateTemplate, Course, UserCertificate, UserCourseProgress } from "@/lib/types";

export function AccountPageClient() {
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [city, setCity] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [progressRows, setProgressRows] = useState<UserCourseProgress[]>([]);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  useEffect(() => {
    async function load() {
      if (!user?.uid) {
        setCourses([]);
        setProgressRows([]);
        setCertificates([]);
        setTemplates([]);
        setDisplayName("");
        setDateOfBirth("");
        setCity("");
        return;
      }

      setLoading(true);
      setStatus("");

      try {
        const [profile, progress, certs, nextCourses, nextTemplates] = await Promise.all([
          getCurrentUserProfile(user.uid),
          getUserCourseProgressList(user.uid),
          getUserCertificates(user.uid),
          getCourses(false),
          getCertificateTemplates()
        ]);

        setDisplayName(profile?.displayName || user.displayName || "");
        setDateOfBirth(profile?.dateOfBirth || "");
        setCity(profile?.city || "");
        setProgressRows(progress);
        setCertificates(certs);
        setCourses(nextCourses);
        setTemplates(nextTemplates);
      } catch {
        setStatus("Could not load your account right now.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user?.uid, user?.displayName]);

  const courseById = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((course) => {
      map[course.id] = course;
    });
    return map;
  }, [courses]);

  const templateById = useMemo(() => {
    const map: Record<string, CertificateTemplate> = {};
    templates.forEach((template) => {
      map[template.id] = template;
    });
    return map;
  }, [templates]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.uid) {
      setStatus("Please login first.");
      setLoginOpen(true);
      return;
    }

    setStatus("");

    try {
      await updateCurrentUserProfile(user.uid, {
        displayName,
        dateOfBirth,
        city
      });

      if (auth?.currentUser) {
        await updateAuthProfile(auth.currentUser, { displayName: displayName.trim() || null });
      }

      setStatus("Profile updated successfully.");
    } catch {
      setStatus("Could not update profile right now.");
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus("");

    if (!user?.uid || !auth?.currentUser || !auth.currentUser.email) {
      setPasswordStatus("Please login first.");
      setLoginOpen(true);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus("New password and confirm password do not match.");
      return;
    }

    try {
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      await updatePassword(auth.currentUser, newPassword);
      setPasswordStatus("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordStatus("Could not update password. Enter current password and try again.");
    }
  }

  if (!user?.uid) {
    return (
      <section className="notice">
        <h3 style={{ marginTop: 0 }}>Login Required</h3>
        <p className="muted">Login to manage your profile, view completed courses, and access certificates.</p>
        <div className="form-actions">
          <button className="btn btn-primary" type="button" onClick={() => setLoginOpen(true)}>
            Login
          </button>
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </section>
    );
  }

  return (
    <>
      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <div className="label">Profile</div>
        <h3 style={{ marginTop: "0.35rem" }}>Account Details</h3>
        <form className="form-grid" onSubmit={handleProfileSubmit}>
          <input
            placeholder="Name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <input
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
          <input
            placeholder="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              Save Profile
            </button>
          </div>
          {status ? <div className="notice">{status}</div> : null}
        </form>
      </section>

      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <div className="label">Security</div>
        <h3 style={{ marginTop: "0.35rem" }}>Change Password</h3>
        <form className="form-grid" onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Update Password</button>
          </div>
          {passwordStatus ? <div className="notice">{passwordStatus}</div> : null}
        </form>
      </section>

      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <div className="label">Account</div>
        <h3 style={{ marginTop: "0.35rem" }}>Completed Courses and Status</h3>
        <div className="table-like" style={{ marginTop: "0.7rem" }}>
          {progressRows.length ? (
            progressRows.map((item) => {
              const course = courseById[item.courseId];
              const totalLessons = course?.lessons.length ?? 0;
              return (
                <article className="notice" key={`account-progress-${item.id}`}>
                  <strong>{course?.title ?? item.courseId}</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Lessons: {item.completedLessonIds.length}/{totalLessons} | Score: {item.score}% | Attempts: {item.testAttempts} | {item.testPassed ? "Passed" : "In Progress"}
                  </p>
                </article>
              );
            })
          ) : (
            <p className="muted">No course progress yet.</p>
          )}
        </div>
      </section>

      <section className="admin-card">
        <div className="label">Certificates</div>
        <h3 style={{ marginTop: "0.35rem" }}>Your Achievements</h3>
        <div className="table-like" style={{ marginTop: "0.7rem" }}>
          {certificates.length ? (
            certificates.map((cert) => {
              const course = courseById[cert.courseId];
              const template = cert.templateId ? templateById[cert.templateId] : undefined;
              const courseTitle = course?.title ?? cert.courseId;
              return (
                <article className="notice" key={`account-certificate-${cert.id}`}>
                  <strong>{courseTitle}</strong>
                  <p className="muted" style={{ marginBottom: "0.45rem" }}>
                    Certificate #{cert.certificateNumber} | Score: {cert.score}% | Attempts: {cert.attempts}
                  </p>
                  <div className="form-actions">
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() =>
                        openCertificatePrint({
                          courseTitle,
                          userName: cert.userName,
                          certificateNumber: cert.certificateNumber,
                          issuedAt: cert.issuedAt,
                          score: cert.score,
                          attempts: cert.attempts,
                          totalQuestions: cert.totalQuestions,
                          passingScore: cert.passingScore,
                          template
                        })
                      }
                    >
                      Download Certificate
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="muted">No certificates yet.</p>
          )}
        </div>
      </section>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
