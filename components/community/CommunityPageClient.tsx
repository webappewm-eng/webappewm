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

const ALL_CATEGORIES = "__all_categories__";

const fallbackSettings: Pick<SiteSettings, "communityApprovalEnabled"> = {
  communityApprovalEnabled: true
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "GU";
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function CommunityPageClient() {
  const { user } = useAuth();

  const [settings, setSettings] = useState(fallbackSettings);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [answers, setAnswers] = useState<CommunityAnswer[]>([]);

  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [searchText, setSearchText] = useState("");

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    name: "",
    categoryId: "",
    question: ""
  });

  const [answerForms, setAnswerForms] = useState<Record<string, { name: string; answer: string }>>({});
  const [replyOpenByQuestion, setReplyOpenByQuestion] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function refreshAll(nextCategoryId?: string, nextSearch?: string) {
    const categorySelection = nextCategoryId ?? selectedCategory;
    const search = nextSearch ?? searchText;
    const categoryId = categorySelection === ALL_CATEGORIES ? undefined : categorySelection;

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

    setQuestionForm((prev) => {
      if (prev.categoryId) {
        return prev;
      }

      if (categorySelection !== ALL_CATEGORIES && nextCategories.some((item) => item.id === categorySelection)) {
        return { ...prev, categoryId: categorySelection };
      }

      return { ...prev, categoryId: nextCategories[0]?.id ?? "" };
    });
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

  useEffect(() => {
    if (!status) {
      return;
    }

    const timer = window.setTimeout(() => setStatus(""), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [categories]);

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

  function openAskModal() {
    setQuestionModalOpen(true);
    setQuestionForm((prev) => ({
      ...prev,
      categoryId:
        prev.categoryId ||
        (selectedCategory !== ALL_CATEGORIES ? selectedCategory : categories[0]?.id || "")
    }));
  }

  async function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const categoryId = questionForm.categoryId || (selectedCategory !== ALL_CATEGORIES ? selectedCategory : categories[0]?.id || "");
    if (!categoryId) {
      setStatus("Please ask admin to create community category first.");
      return;
    }

    const question = questionForm.question.trim();
    if (!question) {
      setStatus("Question cannot be empty.");
      return;
    }

    try {
      await createCommunityQuestion({
        categoryId,
        question,
        authorName: questionForm.name || user?.displayName || "",
        authorEmail: user?.email || "",
        authorUserId: user?.uid || "",
        requiresApproval: settings.communityApprovalEnabled
      });

      setQuestionForm((prev) => ({ ...prev, question: "", categoryId }));
      setQuestionModalOpen(false);
      setStatus(
        settings.communityApprovalEnabled
          ? "Question submitted. It will appear after admin approval."
          : "Question published successfully."
      );
      await refreshAll(selectedCategory, searchText);
    } catch {
      setStatus("Unable to submit question right now.");
    }
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

    try {
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
    } catch {
      setStatus("Unable to submit answer right now.");
    }
  }

  function toggleReplyForm(questionId: string) {
    setReplyOpenByQuestion((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main">
        <section className="section community-shell">
          <div className="label">Community</div>

          <div className="community-header-row">
            <div>
              <h1 className="h2">Ask and answer together</h1>
              <p className="body-txt">
                {settings.communityApprovalEnabled
                  ? "Approval mode is enabled. New questions and answers appear only after admin approval."
                  : "Instant mode is enabled. New questions and answers appear immediately."}
              </p>
            </div>

            <button className="btn btn-primary" type="button" onClick={openAskModal}>
              Ask Question
            </button>
          </div>

          {status ? <div className="notice">{status}</div> : null}
          {status ? <div className="status-toast">{status}</div> : null}

          <div className="community-toolbar">
            <input
              type="search"
              placeholder="Search questions or answers"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <button className="btn btn-outline" type="button" onClick={() => void refreshAll(selectedCategory, searchText)}>
              Search
            </button>
          </div>

          <div className="community-layout">
            <aside className="community-sidebar">
              <button
                className={`community-category-btn ${selectedCategory === ALL_CATEGORIES ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setSelectedCategory(ALL_CATEGORIES);
                  void refreshAll(ALL_CATEGORIES, searchText);
                }}
              >
                All Categories
              </button>

              {categories.map((category) => (
                <button
                  className={`community-category-btn ${selectedCategory === category.id ? "active" : ""}`}
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    void refreshAll(category.id, searchText);
                  }}
                >
                  {category.name}
                </button>
              ))}
            </aside>

            <div className="community-content">
              {loading ? <p className="muted">Loading community...</p> : null}

              <div className="community-list">
                {questions.length ? (
                  questions.map((question) => {
                    const questionAnswers = answersByQuestion[question.id] ?? [];
                    const answerForm = answerForms[question.id] ?? { name: "", answer: "" };
                    const replyOpen = Boolean(replyOpenByQuestion[question.id]);

                    return (
                      <article className="notice community-card-pro" key={question.id}>
                        <div className="community-card-head">
                          <h3>{question.question}</h3>
                          <span className="community-category-pill">
                            {categoryNameById[question.categoryId] ?? "General"}
                          </span>
                        </div>

                        <div className="community-question-author">
                          <span className="community-avatar">{getInitials(question.authorName || "Guest")}</span>
                          <div>
                            <p className="community-author-line">{question.authorName || "Guest"} asked this question</p>
                            <p className="muted">
                              {new Date(question.createdAt).toLocaleDateString()} {question.status !== "approved" ? `| status: ${question.status}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="community-answers">
                          {questionAnswers.length ? (
                            questionAnswers.map((answer) => (
                              <div className="community-answer" key={answer.id}>
                                <div className="community-answer-head">
                                  <span className="community-avatar small">{getInitials(answer.authorName || "Guest")}</span>
                                  <div>
                                    <p className="community-author-line">{answer.authorName || "Guest"} replied</p>
                                    <p className="muted">
                                      {new Date(answer.createdAt).toLocaleDateString()} {answer.status !== "approved" ? `| status: ${answer.status}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <p className="community-answer-text">{answer.answer}</p>
                              </div>
                            ))
                          ) : (
                            <p className="muted">No answers yet.</p>
                          )}
                        </div>

                        <div className="community-reply-toggle-row">
                          <button className="btn btn-outline community-reply-toggle" type="button" onClick={() => toggleReplyForm(question.id)}>
                            {replyOpen ? "Hide Reply ^" : "Add Reply v"}
                          </button>
                          <span className="muted">{questionAnswers.length} answers</span>
                        </div>

                        {replyOpen ? (
                          <form className="form-grid community-answer-form" onSubmit={(event) => void handleAnswerSubmit(event, question)}>
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
                              rows={3}
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
                            <button className="btn btn-primary" type="submit">
                              Post Answer
                            </button>
                          </form>
                        ) : null}
                      </article>
                    );
                  })
                ) : (
                  <p className="muted">No questions found for this category/search yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {questionModalOpen ? (
          <div className="modal-backdrop" onClick={() => setQuestionModalOpen(false)}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
              <h3>Ask a question</h3>
              <p>Pick a category and post your question.</p>

              <form className="form-grid" onSubmit={handleQuestionSubmit}>
                <input
                  placeholder="Your name (optional)"
                  value={questionForm.name}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, name: event.target.value }))}
                />

                <select
                  value={questionForm.categoryId}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  required
                >
                  {categories.length ? null : <option value="">No categories available</option>}
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <textarea
                  rows={4}
                  placeholder="Write your question"
                  value={questionForm.question}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, question: event.target.value }))}
                  required
                />

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit">
                    Post Question
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => setQuestionModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

