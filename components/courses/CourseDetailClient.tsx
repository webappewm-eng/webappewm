"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/components/auth/AuthProvider";
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

function openCertificatePrint(input: {
  courseTitle: string;
  userName: string;
  certificateNumber: string;
  issuedAt: string;
  template?: CertificateTemplate;
}) {
  const popup = window.open("", "_blank", "width=1100,height=760");
  if (!popup) {
    return;
  }

  const dateLabel = new Date(input.issuedAt).toLocaleDateString();
  const bg = input.template?.backgroundImage ? `background-image:url('${input.template.backgroundImage}'); background-size:cover;` : "";
  const signature = input.template?.signatureImage
    ? `<img src="${input.template.signatureImage}" alt="signature" style="height:64px; object-fit:contain;"/>`
    : "";

  popup.document.write(`
    <html>
      <head>
        <title>Certificate - ${input.courseTitle}</title>
      </head>
      <body style="margin:0; font-family:Arial, sans-serif; background:#f2f2f2; padding:24px;">
        <div style="max-width:980px; margin:0 auto; border:8px solid #ff6b00; background:#fff; border-radius:16px; padding:34px; ${bg}">
          <div style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#ff6b00;">Engineer With Me</div>
          <h1 style="margin:8px 0 6px; font-size:46px;">Certificate of Completion</h1>
          <p style="margin:0; font-size:18px; color:#333;">This is awarded to</p>
          <h2 style="margin:8px 0; font-size:38px;">${input.userName}</h2>
          <p style="font-size:18px; color:#333; margin-top:10px;">for successfully completing <strong>${input.courseTitle}</strong></p>
          <p style="font-size:15px; color:#555; margin-top:18px;">Certificate Number: ${input.certificateNumber}</p>
          <p style="font-size:15px; color:#555; margin-top:6px;">Issued on: ${dateLabel}</p>
          <div style="display:flex; justify-content:space-between; align-items:end; margin-top:36px;">
            <div>
              <div style="border-top:1px solid #333; width:220px; margin-top:26px;"></div>
              <div style="font-size:13px; color:#555; margin-top:6px;">Authorized Signature</div>
            </div>
            ${signature}
          </div>
        </div>
      </body>
    </html>
  `);

  popup.document.close();
  popup.focus();
  popup.print();
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
        certificateId: progress?.certificateId ?? ""
      });
    } catch {
      setStatus("Could not save lesson progress.");
    } finally {
      setBusy(false);
    }
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

    if (!course.questions.length) {
      setStatus("No test questions configured for this course.");
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

      const score = Math.round((correct / course.questions.length) * 100);
      const passed = score >= course.passingScore;
      let certificateId = progress?.certificateId ?? "";
      let issued: UserCertificate | null = certificate;

      if (passed && !certificateId) {
        const created = await issueCertificate({
          courseId: course.id,
          userId: user.uid,
          userEmail: user.email ?? "",
          userName: user.email.split("@")[0],
          templateId: activeTemplate?.id ?? ""
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
        certificateId
      });

      if (passed) {
        setStatus(`Great work. You passed with ${score}% and your certificate is ready.`);
        if (issued) {
          openCertificatePrint({
            courseTitle: course.title,
            userName: issued.userName,
            certificateNumber: issued.certificateNumber,
            issuedAt: issued.issuedAt,
            template: activeTemplate
          });
        }
      } else {
        setStatus(`Your score is ${score}%. Passing score is ${course.passingScore}%. Please retry.`);
      }
    } catch {
      setStatus("Could not submit test right now.");
    } finally {
      setBusy(false);
    }
  }

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
          <p className="muted">Use the sidebar to open each section. Mark each one complete to unlock the test.</p>

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
          <div className="label">Certification Test</div>
          <p className="muted">
            {allLessonsCompleted ? "Test unlocked. Complete the quiz to generate your certificate." : "Complete all lessons to unlock test."}
          </p>

          <form className="form-grid" onSubmit={submitTest}>
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
                        disabled={!allLessonsCompleted || busy}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </article>
            ))}

            <button className="btn btn-primary" type="submit" disabled={!allLessonsCompleted || busy}>
              {busy ? "Submitting..." : "Submit Test"}
            </button>
          </form>

          {progress ? (
            <div className="notice" style={{ marginTop: "0.85rem" }}>
              <strong>Your progress</strong>
              <p className="muted">
                Lessons completed: {progress.completedLessonIds.length}/{lessonIds.length} | Score: {progress.score}% | {progress.testPassed ? "Passed" : "Not passed yet"}
              </p>
            </div>
          ) : null}

          {certificate ? (
            <div className="form-actions" style={{ marginTop: "0.8rem" }}>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() =>
                  openCertificatePrint({
                    courseTitle: course.title,
                    userName: certificate.userName,
                    certificateNumber: certificate.certificateNumber,
                    issuedAt: certificate.issuedAt,
                    template: activeTemplate
                  })
                }
              >
                Download Certificate
              </button>
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
