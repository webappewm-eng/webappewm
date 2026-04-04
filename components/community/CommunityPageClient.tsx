"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  createCommunityAnswer,
  createCommunityQuestion,
  getCommunityAnswersForPublic,
  getCommunityCategories,
  getCommunityQuestionsForPublic,
  getSiteSettings
} from "@/lib/firebase/data";
import { CommunityAnswer, CommunityCategory, CommunityQuestion, SiteSettings } from "@/lib/types";

const fallbackSettings: Pick<SiteSettings, "communityApprovalEnabled"> = {
  communityApprovalEnabled: true
};

export default function CommunityPageClient() {
  const { user } = useAuth();

  const [settings, setSettings] = useState(fallbackSettings);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [answers, setAnswers] = useState<CommunityAnswer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchText, setSearchText] = useState("");

  const [questionForm, setQuestionForm] = useState({
    name: "",
    question: ""
  });
  const [answerForms, setAnswerForms] = useState<Record<string, { name: string; answer: string }>>({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function refreshAll(nextCategoryId?: string, nextSearch?: string) {
    const categoryId = nextCategoryId ?? selectedCategory;
    const search = nextSearch ?? searchText;

    const [siteSettings, nextCategories, nextQuestions, nextAnswers] = await Promise.all([
      getSiteSettings(),
      getCommunityCategories(),
      getCommunityQuestionsForPublic({ categoryId, search }),
      getCommunityAnswersForPublic({ categoryId, search })
    ]);

    setSettings({ communityApprovalEnabled: siteSettings.communityApprovalEnabled });
    setCategories(nextCategories);
    setQuestions(nextQuestions);
    setAnswers(nextAnswers);

    if (!categoryId && nextCategories.length) {
      setSelectedCategory(nextCategories[0].id);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshAll();
      } catch {
        setStatus("Community data could not be loaded right now.");
      } finally {
        setLoading(false);
      }
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answersByQuestion = useMemo(() => {
    const map: Record<string, CommunityAnswer[]> = {};
    answers.forEach((item) => {
      if (!map[item.questionId]) {
        map[item.questionId] = [];
      }
      map[item.questionId].push(item);
    });

    Object.keys(map).forEach((key) => {
      map[key] = map[key].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });

    return map;
  }, [answers]);

  async function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const categoryId = selectedCategory || categories[0]?.id || "";
    if (!categoryId) {
      setStatus("Please ask admin to create community category first.");
      return;
    }

    const question = questionForm.question.trim();
    if (!question) {
      setStatus("Question cannot be empty.");
      return;
    }

    await createCommunityQuestion({
      categoryId,
      question,
      authorName: questionForm.name || user?.displayName || "",
      authorEmail: user?.email || "",
      authorUserId: user?.uid || "",
      requiresApproval: settings.communityApprovalEnabled
    });

    setQuestionForm((prev) => ({ ...prev, question: "" }));
    setStatus(
      settings.communityApprovalEnabled
        ? "Question submitted. It will appear after admin approval."
        : "Question published successfully."
    );

    await refreshAll(categoryId, searchText);
  }

  async function handleAnswerSubmit(event: FormEvent<HTMLFormElement>, question: CommunityQuestion) {
    event.preventDefault();
    setStatus("");

    const form = answerForms[question.id] ?? { name: "", answer: "" };
    const answer = form.answer.trim();
    if (!answer) {
      setStatus("Answer cannot be empty.");
      return;
    }

    await createCommunityAnswer({
      questionId: question.id,
      categoryId: question.categoryId,
      answer,
      authorName: form.name || user?.displayName || "",
      authorEmail: user?.email || "",
      authorUserId: user?.uid || "",
      requiresApproval: settings.communityApprovalEnabled
    });

    setAnswerForms((prev) => ({
      ...prev,
      [question.id]: { ...form, answer: "" }
    }));

    setStatus(
      settings.communityApprovalEnabled
        ? "Answer submitted. It will appear after admin approval."
        : "Answer published successfully."
    );

    await refreshAll(selectedCategory, searchText);
  }

  return (
    <div className="app-shell">
      <Header onOpenLogin={() => undefined} showSearch={false} />
      <main className="page-main">
        <section className="section">
          <div className="label">Community</div>
          <h1 className="h2">Ask and answer together</h1>
          <p className="body-txt">
            {settings.communityApprovalEnabled
              ? "Admin approval mode is enabled. New questions and answers will appear after approval."
              : "Instant mode is enabled. New questions and answers appear immediately."}
          </p>

          {status ? <div className="notice">{status}</div> : null}

          <div className="community-toolbar">
            <select
              value={selectedCategory}
              onChange={(event) => {
                const next = event.target.value;
                setSelectedCategory(next);
                void refreshAll(next, searchText);
              }}
            >
              {categories.length ? null : <option value="">No categories</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search questions or answers"
              value={searchText}
              onChange={(event) => {
                const next = event.target.value;
                setSearchText(next);
              }}
            />
            <button className="btn btn-outline" type="button" onClick={() => void refreshAll(selectedCategory, searchText)}>
              Search
            </button>
          </div>

          <form className="form-grid community-form" onSubmit={handleQuestionSubmit}>
            <h3>Ask a question</h3>
            <input
              placeholder="Your name (optional)"
              value={questionForm.name}
              onChange={(event) => setQuestionForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <textarea
              rows={3}
              placeholder="Write your question"
              value={questionForm.question}
              onChange={(event) => setQuestionForm((prev) => ({ ...prev, question: event.target.value }))}
              required
            />
            <button className="btn btn-primary" type="submit">
              Post Question
            </button>
          </form>

          {loading ? <p className="muted">Loading community...</p> : null}

          <div className="community-list">
            {questions.length ? (
              questions.map((question) => {
                const questionAnswers = answersByQuestion[question.id] ?? [];
                const answerForm = answerForms[question.id] ?? { name: "", answer: "" };
                return (
                  <article className="notice community-card" key={question.id}>
                    <h3>{question.question}</h3>
                    <p className="muted">
                      By {question.authorName || "Guest"} on {new Date(question.createdAt).toLocaleDateString()} {" "}
                      {question.status !== "approved" ? `| status: ${question.status}` : ""}
                    </p>

                    <div className="community-answers">
                      {questionAnswers.length ? (
                        questionAnswers.map((answer) => (
                          <div className="community-answer" key={answer.id}>
                            <p>{answer.answer}</p>
                            <p className="muted">
                              By {answer.authorName || "Guest"} on {new Date(answer.createdAt).toLocaleDateString()} {" "}
                              {answer.status !== "approved" ? `| status: ${answer.status}` : ""}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="muted">No answers yet.</p>
                      )}
                    </div>

                    <form className="form-grid" onSubmit={(event) => void handleAnswerSubmit(event, question)}>
                      <input
                        placeholder="Your name (optional)"
                        value={answerForm.name}
                        onChange={(event) =>
                          setAnswerForms((prev) => ({
                            ...prev,
                            [question.id]: { ...answerForm, name: event.target.value }
                          }))
                        }
                      />
                      <textarea
                        rows={2}
                        placeholder="Write your answer"
                        value={answerForm.answer}
                        onChange={(event) =>
                          setAnswerForms((prev) => ({
                            ...prev,
                            [question.id]: { ...answerForm, answer: event.target.value }
                          }))
                        }
                        required
                      />
                      <button className="btn btn-outline" type="submit">
                        Post Answer
                      </button>
                    </form>
                  </article>
                );
              })
            ) : (
              <p className="muted">No questions found for this category/search yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
