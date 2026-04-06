"use client";

import { useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { openCertificatePrint } from "@/lib/certificates/print";
import { getCertificateTemplates, getCourses, getUserCertificates } from "@/lib/firebase/data";
import { CertificateTemplate, Course, UserCertificate } from "@/lib/types";

export function CertificationDashboardPanel() {
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  useEffect(() => {
    async function load() {
      if (!user?.uid) {
        setCertificates([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [nextCertificates, nextCourses, nextTemplates] = await Promise.all([
          getUserCertificates(user.uid),
          getCourses(false),
          getCertificateTemplates()
        ]);
        setCertificates(nextCertificates);
        setCourses(nextCourses);
        setTemplates(nextTemplates);
      } catch {
        setError("Could not load your certification dashboard right now.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user?.uid]);

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

  return (
    <section className="notice" style={{ marginBottom: "1rem" }}>
      <div className="label">User Dashboard</div>
      <h3 style={{ marginTop: "0.25rem" }}>Your Certifications</h3>

      {!user?.uid ? (
        <div className="form-actions" style={{ marginTop: "0.65rem" }}>
          <p className="muted" style={{ margin: 0 }}>Login to see your achieved certificates and download them anytime.</p>
          <button className="btn btn-primary" type="button" onClick={() => setLoginOpen(true)}>
            Login to View Certifications
          </button>
        </div>
      ) : null}

      {user?.uid && loading ? <p className="muted">Loading certifications...</p> : null}
      {user?.uid && error ? <p className="muted">{error}</p> : null}

      {user?.uid && !loading && !error ? (
        <div className="table-like" style={{ marginTop: "0.7rem" }}>
          {certificates.length ? (
            certificates.map((cert) => {
              const course = courseById[cert.courseId];
              const template = cert.templateId ? templateById[cert.templateId] : undefined;
              const courseTitle = course?.title ?? cert.courseId;
              const passingScore = cert.passingScore || course?.passingScore || 0;

              return (
                <article className="notice" key={`dashboard-cert-${cert.id}`}>
                  <strong>{courseTitle}</strong>
                  <p className="muted">
                    Certificate #{cert.certificateNumber} | Score: {cert.score}% | Attempts: {cert.attempts} | Questions: {cert.totalQuestions}
                  </p>
                  <p className="muted">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
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
                          passingScore,
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
            <p className="muted">No certificates yet. Complete a course test to earn your first certificate.</p>
          )}
        </div>
      ) : null}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  );
}
