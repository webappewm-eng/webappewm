"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { openCertificatePrint } from "@/lib/certificates/print";
import {
  getCertificateTemplates,
  getUserCertificates,
  getUserCourseProgress,
  issueCertificate,
  upsertUserCourseProgress
} from "@/lib/firebase/data";
import { CertificateTemplate, Course, CourseAd, UserCertificate, UserCourseProgress } from "@/lib/types";

interface CourseDetailClientProps {
  course: Course;
  ads?: CourseAd[];
  nextCourse?: { slug: string; title: string } | null;
}

function renderAdItem(ad: CourseAd) {
  if (ad.type === "code") {
    const srcDoc = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body>${ad.code || ""}</body></html>`;
    return (
      <iframe
        title={`course-ad-${ad.id}`}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-same-origin"
        style={{ width: "100%", minHeight: "180px", border: "1px solid var(--border)", borderRadius: "8px" }}
      />
    );
  }

  if (ad.type === "video") {
    const player = (
      <video controls style={{ width: "100%", borderRadius: "8px", background: "#000" }}>
        <source src={ad.source} />
      </video>
    );

    return ad.redirectUrl ? (
      <a href={ad.redirectUrl} target="_blank" rel="noreferrer">
        {player}
      </a>
    ) : (
      player
    );
  }

  const image = <img src={ad.source} alt={ad.title || ad.name} style={{ width: "100%", borderRadius: "8px" }} />;
  return ad.redirectUrl ? (
    <a href={ad.redirectUrl} target="_blank" rel="noreferrer">
      {image}
    </a>
  ) : (
    image
  );
}

export function CourseDetailClient({ course, ads = [], nextCourse = null }: CourseDetailClientProps) {
  const { user } = useAuth();

  const [progress, setProgress] = useState<UserCourseProgress | null>(null);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [certificate, setCertificate] = useState<UserCertificate | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [testPanelOpen, setTestPanelOpen] = useState(false);

  const sortedLessons = useMemo(
    () => course.lessons.slice().sort((a, b) => a.order - b.order),
    [course.lessons]
  );

  useEffect(() => {
    setSelectedLessonId(sortedLessons[0]?.id ?? "");
  }, [course.id, sortedLessons]);

  const lessonIds = useMemo(() => sortedLessons.map((lesson) => lesson.id), [sortedLessons]);
  const completedSet = useMemo(() => new Set(progress?.completedLessonIds ?? []), [progress?.completedLessonIds]);
  const allLessonsCompleted = lessonIds.length > 0 && lessonIds.every((id) => completedSet.has(id));
  const activeLessonIndex = Math.max(0, sortedLessons.findIndex((lesson) => lesson.id === selectedLessonId));
  const activeLesson = sortedLessons[activeLessonIndex] ?? sortedLessons[0] ?? null;
  const hasTestQuestions = course.questions.length > 0;

  const activeTemplate = useMemo(() => {
    if (!templates.length) {
      return undefined;
    }
    if (course.templateId) {
      const match = templates.find((item) => item.id === course.templateId);
      if (match) {
        return match;
      }
    }
    return templates.find((item) => item.enabled) ?? templates[0];
  }, [course.templateId, templates]);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) {
        setProgress(null);
        setCertificate(null);
        return;
      }

      try {
        const [nextProgress, nextCertificates, nextTemplates] = await Promise.all([
          getUserCourseProgress(course.id, user.uid),
          getUserCertificates(user.uid),
          getCertificateTemplates()
        ]);

        setProgress(nextProgress);
        setTemplates(nextTemplates);
        setCertificate(nextCertificates.find((item) => item.courseId === course.id) ?? null);
      } catch {
        setStatus("Could not load progress right now.");
      }
    }

    void loadData();
  }, [course.id, user?.uid]);

  async function saveProgress(next: {
    completedLessonIds: string[];
    testUnlocked: boolean;
    testPassed: boolean;
    score: number;
    testAttempts: number;
    certificateId?: string;
  }) {
    if (!user?.uid || !user.email) {
      setStatus("Please login to track your progress.");
      setLoginOpen(true);
      return;
    }

    await upsertUserCourseProgress({
      courseId: course.id,
      userId: user.uid,
      userEmail: user.email ?? "",
      completedLessonIds: next.completedLessonIds,
      testUnlocked: next.testUnlocked,
      testPassed: next.testPassed,
      score: next.score,
      testAttempts: next.testAttempts,
      certificateId: next.certificateId ?? ""
    });

    setProgress((prev) => ({
      id: prev?.id ?? `local-${Date.now()}`,
      courseId: course.id,
      userId: user.uid,
      userEmail: user.email ?? "",
      completedLessonIds: next.completedLessonIds,
      testUnlocked: next.testUnlocked,
      testPassed: next.testPassed,
      score: next.score,
      testAttempts: next.testAttempts,
      certificateId: next.certificateId ?? "",
      updatedAt: new Date().toISOString()
    }));
  }

  async function toggleLesson(lessonId: string) {
    if (!user?.uid) {
      setStatus("Please login first to continue course tracking.");
      setLoginOpen(true);
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const currentIds = progress?.completedLessonIds ?? [];
      const exists = currentIds.includes(lessonId);
      const nextCompleted = exists ? currentIds.filter((item) => item !== lessonId) : [...currentIds, lessonId];
      const nextUnlocked = lessonIds.length > 0 && lessonIds.every((id) => nextCompleted.includes(id));

      await saveProgress({
        completedLessonIds: nextCompleted,
        testUnlocked: nextUnlocked,
        testPassed: progress?.testPassed ?? false,
        score: progress?.score ?? 0,
        testAttempts: progress?.testAttempts ?? 0,
        certificateId: progress?.certificateId ?? ""
      });
    } catch {
      setStatus("Could not save lesson progress.");
    } finally {
      setBusy(false);
    }
  }

  function handleOpenTestPanel() {
    setStatus("");

    if (!user?.uid) {
      setStatus("Login is required to take this certification test.");
      setLoginOpen(true);
      return;
    }

    if (!allLessonsCompleted) {
      setStatus("Complete all sections first, then start the certification test.");
      return;
    }

    if (!hasTestQuestions) {
      setStatus("This course has no test questions yet. Certification test is optional in admin.");
      return;
    }

    setTestPanelOpen(true);
  }

  async function submitTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!user?.uid || !user.email) {
      setStatus("Please login to submit the test.");
      setLoginOpen(true);
      return;
    }

    if (!allLessonsCompleted) {
      setStatus("Complete all lessons to unlock the test.");
      return;
    }

    if (!hasTestQuestions) {
      setStatus("No test questions configured for this course.");
      return;
    }

    const unansweredIndex = course.questions.findIndex((_, index) => answers[index] === undefined);
    if (unansweredIndex >= 0) {
      setStatus(`Please answer question ${unansweredIndex + 1} before submitting.`);
      return;
    }

    setBusy(true);

    try {
      let correct = 0;
      course.questions.forEach((question, index) => {
        if (answers[index] === question.correctOptionIndex) {
          correct += 1;
        }
      });

      const attempts = (progress?.testAttempts ?? 0) + 1;
      const score = Math.round((correct / course.questions.length) * 100);
      const passed = score >= course.passingScore;
      let certificateId = progress?.certificateId ?? "";
      let issued: UserCertificate | null = certificate;

      if (passed && !certificateId) {
        const created = await issueCertificate({
          courseId: course.id,
          userId: user.uid,
          userEmail: user.email ?? "",
          userName: user.displayName?.trim() || user.email.split("@")[0],
          templateId: activeTemplate?.id ?? "",
          score,
          attempts,
          totalQuestions: course.questions.length,
          passingScore: course.passingScore
        });
        certificateId = created.id;
        issued = created;
        setCertificate(created);
      }

      await saveProgress({
        completedLessonIds: progress?.completedLessonIds ?? lessonIds,
        testUnlocked: true,
        testPassed: passed,
        score,
        testAttempts: attempts,
        certificateId
      });

      if (passed) {
        setStatus(`Great work. You passed with ${score}% in ${attempts} attempt(s). Certificate is ready.`);
        if (issued) {
          openCertificatePrint({
            courseTitle: course.title,
            userName: issued.userName,
            certificateNumber: issued.certificateNumber,
            issuedAt: issued.issuedAt,
            score: issued.score || score,
            attempts: issued.attempts || attempts,
            totalQuestions: issued.totalQuestions || course.questions.length,
            passingScore: issued.passingScore || course.passingScore,
            template: activeTemplate
          });
        }
      } else {
        setStatus(`Your score is ${score}%. Pass mark is ${course.passingScore}%. Attempts used: ${attempts}. Try again.`);
      }
    } catch {
      setStatus("Could not submit test right now.");
    } finally {
      setBusy(false);
    }
  }

  const certificateScore = certificate?.score ?? progress?.score ?? 0;
  const certificateAttempts = certificate?.attempts ?? progress?.testAttempts ?? 0;
  const certificateQuestions = certificate?.totalQuestions ?? course.questions.length;
  const certificatePassMark = certificate?.passingScore ?? course.passingScore;

  return (
    <>
      {course.adsEnabled && ads.length ? (
        <section className="post-content" style={{ marginTop: "1rem" }}>
          <div className="post-content-inner">
            <div className="label">Sponsored</div>
            <div className="table-like" style={{ marginTop: "0.8rem" }}>
              {ads.map((ad) => (
                <article className="notice" key={`course-ad-${ad.id}`}>
                  <strong>{ad.title || ad.name}</strong>
                  <div style={{ marginTop: "0.6rem" }}>{renderAdItem(ad)}</div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="post-content" style={{ marginTop: "1rem" }}>
        <div className="post-content-inner">
          <div className="label">Course Sections</div>
          <p className="muted">Use the sidebar to open each section. Mark each one complete to unlock the certification button.</p>

          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: sortedLessons.length > 1 ? "minmax(220px, 280px) minmax(0, 1fr)" : "minmax(0, 1fr)"
            }}
          >
            {sortedLessons.length > 1 ? (
              <aside className="notice" style={{ alignSelf: "start" }}>
                <strong>Available Sections</strong>
                <div className="table-like" style={{ marginTop: "0.7rem" }}>
                  {sortedLessons.map((lesson, index) => {
                    const completed = completedSet.has(lesson.id);
                    const active = activeLesson?.id === lesson.id;
                    return (
                      <button
                        key={`course-lesson-nav-${lesson.id}`}
                        className={`btn ${active ? "btn-primary" : "btn-outline"}`}
                        type="button"
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        {index + 1}. {lesson.title} {completed ? "(Done)" : ""}
                      </button>
                    );
                  })}
                </div>
              </aside>
            ) : null}

            <article className="notice">
              {activeLesson ? (
                <>
                  <div className="form-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{activeLesson.title}</strong>
                    <label style={{ display: "inline-flex", gap: "0.45rem", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={completedSet.has(activeLesson.id)}
                        disabled={busy}
                        onChange={() => void toggleLesson(activeLesson.id)}
                      />
                      Complete
                    </label>
                  </div>

                  <p className="muted" style={{ marginTop: "0.7rem", whiteSpace: "pre-wrap" }}>{activeLesson.content}</p>

                  <div className="form-actions" style={{ marginTop: "0.8rem", justifyContent: "space-between" }}>
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={activeLessonIndex <= 0}
                      onClick={() => setSelectedLessonId(sortedLessons[Math.max(0, activeLessonIndex - 1)]?.id ?? activeLesson.id)}
                    >
                      Previous Section
                    </button>
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={activeLessonIndex >= sortedLessons.length - 1}
                      onClick={() => setSelectedLessonId(sortedLessons[Math.min(sortedLessons.length - 1, activeLessonIndex + 1)]?.id ?? activeLesson.id)}
                    >
                      Next Section
                    </button>
                  </div>
                </>
              ) : (
                <p className="muted">No sections configured for this course yet.</p>
              )}
            </article>
          </div>
        </div>
      </section>

      <section className="post-content" style={{ marginTop: "1rem" }}>
        <div className="post-content-inner">
          <div className="label">Certification</div>

          <article className="course-cert-cta-card">
            <div className="course-cert-cta-copy">
              <h3>Complete Test to Get Certified</h3>
              <p>
                Login is required. Finish all sections, answer every question, and pass {course.passingScore}% to generate your certificate.
              </p>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleOpenTestPanel}
              disabled={busy || !hasTestQuestions}
            >
              {hasTestQuestions ? "Complete Test to Get Certified" : "Certification Test Not Configured"}
            </button>
          </article>

          {testPanelOpen && hasTestQuestions ? (
            <form className="form-grid" onSubmit={submitTest} style={{ marginTop: "1rem" }}>
              {course.questions.map((question, questionIndex) => (
                <article className="notice" key={`${course.id}-q-${questionIndex}`}>
                  <strong>{questionIndex + 1}. {question.question}</strong>
                  <div className="table-like" style={{ marginTop: "0.55rem" }}>
                    {question.options.map((option, optionIndex) => (
                      <label key={`${course.id}-q-${questionIndex}-o-${optionIndex}`} style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={answers[questionIndex] === optionIndex}
                          onChange={() => setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))}
                          disabled={busy}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </article>
              ))}

              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "Submitting..." : "Submit Certification Test"}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setTestPanelOpen(false)} disabled={busy}>
                  Close Test Panel
                </button>
              </div>
            </form>
          ) : null}

          {progress ? (
            <div className="notice" style={{ marginTop: "0.85rem" }}>
              <strong>Your progress</strong>
              <p className="muted">
                Lessons completed: {progress.completedLessonIds.length}/{lessonIds.length} | Score: {progress.score}% | Attempts: {progress.testAttempts} | {progress.testPassed ? "Passed" : "Not passed yet"}
              </p>
            </div>
          ) : null}

          {certificate ? (
            <div className="notice" style={{ marginTop: "0.85rem" }}>
              <strong>Certificate Ready</strong>
              <p className="muted">
                Score: {certificateScore}% | Attempts: {certificateAttempts} | Questions: {certificateQuestions} | Pass Mark: {certificatePassMark}%
              </p>
              <div className="form-actions" style={{ marginTop: "0.6rem" }}>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() =>
                    openCertificatePrint({
                      courseTitle: course.title,
                      userName: certificate.userName,
                      certificateNumber: certificate.certificateNumber,
                      issuedAt: certificate.issuedAt,
                      score: certificateScore,
                      attempts: certificateAttempts,
                      totalQuestions: certificateQuestions,
                      passingScore: certificatePassMark,
                      template: activeTemplate
                    })
                  }
                >
                  Download Certificate
                </button>
              </div>
            </div>
          ) : null}

          {nextCourse ? (
            <div className="form-actions" style={{ marginTop: "0.75rem" }}>
              <Link className="btn btn-primary" href={`/courses/${nextCourse.slug}`}>
                Move to Next Course: {nextCourse.title}
              </Link>
            </div>
          ) : null}

          {status ? <div className="notice" style={{ marginTop: "0.8rem" }}>{status}</div> : null}
        </div>
      </section>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
