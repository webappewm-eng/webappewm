"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimationShowcase } from "@/components/home/AnimationShowcase";
import { HeroCircuitVisual } from "@/components/home/HeroCircuitVisual";
import { LoginModal } from "@/components/auth/LoginModal";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NotificationStrip } from "@/components/layout/NotificationStrip";
import { getCategories, getPosts, getSubtopics } from "@/lib/firebase/data";
import { Category, Post, Subtopic } from "@/lib/types";

const videoSlides = [
  {
    id: "video-1",
    title: "Real circuit walkthrough",
    source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  },
  {
    id: "video-2",
    title: "Hands-on component demo",
    source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm"
  }
];

const imageSlides = [
  {
    id: "img-1",
    title: "Build from fundamentals",
    source:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "img-2",
    title: "Practical electronics learning",
    source:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "img-3",
    title: "From theory to projects",
    source:
      "https://images.unsplash.com/photo-1581092919535-7146ff1a5902?auto=format&fit=crop&w=1400&q=80"
  }
];

const learningPaths = [
  {
    id: "science",
    icon: "Science",
    tag: "Science",
    title: "How the world works",
    desc: "Atoms, charge, energy, magnetism, light, and heat.",
    topics: ["Ohms Law", "Electricity", "Magnetism", "Energy"],
    colorClass: "path-science"
  },
  {
    id: "maths",
    icon: "Math",
    tag: "Mathematics",
    title: "Tools engineers use",
    desc: "Number systems, algebra, graphs, and trigonometry.",
    topics: ["Binary", "Algebra", "Trig", "Boolean"],
    colorClass: "path-maths"
  },
  {
    id: "mechanical",
    icon: "Mech",
    tag: "Mechanical",
    title: "The physical world",
    desc: "Forces, gears, materials, motion, and structures.",
    topics: ["Forces", "Gears", "Materials", "Motion"],
    colorClass: "path-mechanical"
  },
  {
    id: "electronics",
    icon: "Elec",
    tag: "Electronics",
    title: "Components and circuits",
    desc: "Resistors, capacitors, transistors, and sensors.",
    topics: ["Resistor", "Capacitor", "LED", "Transistor"],
    colorClass: "path-electronics"
  },
  {
    id: "software",
    icon: "Code",
    tag: "Software",
    title: "Code for hardware",
    desc: "C, Arduino, and communication protocols.",
    topics: ["Arduino", "I2C/SPI", "UART", "PWM"],
    colorClass: "path-software"
  },
  {
    id: "tools",
    icon: "Tools",
    tag: "Workshop",
    title: "From theory to bench",
    desc: "Multimeter, soldering, oscilloscope, and datasheets.",
    topics: ["Multimeter", "Soldering", "Oscilloscope", "KiCad"],
    colorClass: "path-tools"
  }
];

const quickTopics = ["Battery", "Ohms Law", "Resistor", "Capacitor", "LED", "Gears", "Arduino", "ESP32"];

const courses = [
  {
    title: "Electronics 101",
    meta: "12 lessons",
    tag: "Free"
  },
  {
    title: "Arduino Masterclass",
    meta: "24 lessons",
    tag: "Free"
  },
  {
    title: "ESP32 and IoT",
    meta: "18 lessons",
    tag: "Pro"
  }
];

interface HomePageClientProps {
  initialCategories: Category[];
  initialSubtopics: Subtopic[];
  initialPosts: Post[];
  requestedCategory?: string;
  requestedSubtopic?: string;
}

export default function HomePageClient({
  initialCategories,
  initialSubtopics,
  initialPosts,
  requestedCategory = "",
  requestedSubtopic = ""
}: HomePageClientProps) {
  const normalizedRequestedCategory = requestedCategory.trim().toLowerCase();
  const normalizedRequestedSubtopic = requestedSubtopic.trim().toLowerCase();

  const initialSelectedCategory = useMemo(() => {
    const requested = initialCategories.find((item) => {
      const slug = item.slug.toLowerCase();
      const id = item.id.toLowerCase();
      return normalizedRequestedCategory ? slug === normalizedRequestedCategory || id === normalizedRequestedCategory : false;
    });
    return requested?.id ?? initialCategories[0]?.id ?? "";
  }, [initialCategories, normalizedRequestedCategory]);

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [allSubtopics, setAllSubtopics] = useState<Subtopic[]>(initialSubtopics);
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialSelectedCategory);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [searchText, setSearchText] = useState("");

  const [videoIndex, setVideoIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(initialCategories.length === 0 && initialPosts.length === 0);
  const [loadError, setLoadError] = useState("");

  const subtopics = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }
    return allSubtopics.filter((item) => item.categoryId === selectedCategory);
  }, [allSubtopics, selectedCategory]);

  useEffect(() => {
    async function refreshFromFirebase() {
      try {
        const [nextCategories, nextSubtopics, nextPosts] = await Promise.all([
          getCategories(),
          getSubtopics(),
          getPosts()
        ]);

        setCategories(nextCategories);
        setAllSubtopics(nextSubtopics);
        setPosts(nextPosts);
        setLoadError("");

        setSelectedCategory((prev) => {
          if (prev && nextCategories.some((item) => item.id === prev)) {
            return prev;
          }
          const requested = nextCategories.find((item) => {
            const slug = item.slug.toLowerCase();
            const id = item.id.toLowerCase();
            return normalizedRequestedCategory ? slug === normalizedRequestedCategory || id === normalizedRequestedCategory : false;
          });
          return requested?.id ?? nextCategories[0]?.id ?? "";
        });
      } catch {
        setLoadError("Unable to load categories/posts from Firebase right now.");
      } finally {
        setLoading(false);
      }
    }

    void refreshFromFirebase();
  }, [normalizedRequestedCategory]);

  useEffect(() => {
    if (!selectedCategory) {
      setSelectedSubtopic("");
      return;
    }

    if (!subtopics.length) {
      setSelectedSubtopic("");
      return;
    }

    const matchesCurrent = subtopics.some((item) => item.id === selectedSubtopic);
    if (matchesCurrent) {
      return;
    }

    const requested = subtopics.find((item) => {
      const slug = item.slug.toLowerCase();
      const id = item.id.toLowerCase();
      return normalizedRequestedSubtopic ? slug === normalizedRequestedSubtopic || id === normalizedRequestedSubtopic : false;
    });

    setSelectedSubtopic(requested?.id ?? subtopics[0].id);
  }, [selectedCategory, selectedSubtopic, subtopics, normalizedRequestedSubtopic]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setVideoIndex((prev) => (prev + 1) % videoSlides.length);
      setImageIndex((prev) => (prev + 1) % imageSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchCategory = selectedCategory ? post.categoryId === selectedCategory : true;
      const matchSubtopic = selectedSubtopic ? post.subtopicId === selectedSubtopic : true;
      const matchSearch =
        !searchText.trim() ||
        [post.title, post.excerpt, post.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(searchText.toLowerCase());

      return matchCategory && matchSubtopic && matchSearch;
    });
  }, [posts, searchText, selectedCategory, selectedSubtopic]);

  return (
    <div className="app-shell">
      <Header onOpenLogin={() => setLoginOpen(true)} searchValue={searchText} onSearchChange={setSearchText} />
      <main className="page-main">
        <NotificationStrip />

        <section className="hero">
          <div className="hero-inner">
            <div>
              <div className="hero-tag">Where engineers are made</div>
              <h1>
                Learn <span className="o">Engineering.</span>
                <br />
                From scratch.
              </h1>
              <p className="hero-sub">
                Animated explainers, interactive simulations, and free courses across science, electronics,
                mechanical, and software foundations.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#categories">
                  Start Learning Free
                </a>
                <a className="btn btn-outline" href="#topics">
                  View Topics
                </a>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-n">100+</span>
                  <span className="stat-l">Free Topics</span>
                </div>
                <div className="stat">
                  <span className="stat-n">4</span>
                  <span className="stat-l">Disciplines</span>
                </div>
                <div className="stat">
                  <span className="stat-n">0</span>
                  <span className="stat-l">To Start</span>
                </div>
              </div>
            </div>

            <div className="hero-slider-wrap">
              <div className="slider-box">
                <p className="slider-label">Video Slider</p>
                <div className="slide">
                  <video
                    key={videoSlides[videoIndex].id}
                    src={videoSlides[videoIndex].source}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  <span className="slide-caption">{videoSlides[videoIndex].title}</span>
                </div>
              </div>

              <div className="slider-box">
                <p className="slider-label">Image Slider</p>
                <div className="slide">
                  <Image
                    key={imageSlides[imageIndex].id}
                    src={imageSlides[imageIndex].source}
                    alt={imageSlides[imageIndex].title}
                    width={1200}
                    height={800}
                  />
                  <span className="slide-caption">{imageSlides[imageIndex].title}</span>
                </div>
              </div>

              <div className="slider-box">
                <p className="slider-label">Circuit Visual</p>
                <div className="slide slide-svg">
                  <HeroCircuitVisual />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="label">How It Works</div>
          <h2 className="h2">Learn in 3 steps</h2>
          <div className="steps-grid">
            <article className="step-card">
              <h3>1. Read the concept</h3>
              <p>Plain-English explanations with practical examples.</p>
            </article>
            <article className="step-card">
              <h3>2. Watch it animate</h3>
              <p>Visual previews that explain behavior of components and systems.</p>
            </article>
            <article className="step-card">
              <h3>3. Interact and test</h3>
              <p>Adjust values and see outcomes before trying on hardware.</p>
            </article>
          </div>
        </section>

        <section className="section section-accent">
          <div className="label">Learning Paths</div>
          <h2 className="h2">Six foundations of every engineer</h2>
          <p className="body-txt">Start anywhere and progressively build cross-disciplinary understanding.</p>
          <div className="paths-grid">
            {learningPaths.map((path) => (
              <article key={path.id} className={`path-card ${path.colorClass}`}>
                <div className="path-icon">{path.icon}</div>
                <div className="path-tag">{path.tag}</div>
                <h3 className="path-title">{path.title}</h3>
                <p className="path-desc">{path.desc}</p>
                <div className="path-topics">
                  {path.topics.map((topic) => (
                    <span key={`${path.id}-${topic}`} className="pill">
                      {topic}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="label">Live Preview</div>
          <h2 className="h2">See it in action</h2>
          <p className="body-txt">Every topic includes an interactive explanation block like this.</p>
          <AnimationShowcase />
        </section>

        <section className="section section-accent" id="categories">
          <div className="label">Categories</div>
          <h2 className="h2">Pick a Category</h2>
          <p className="body-txt">All categories are loaded from admin-managed data in Firebase.</p>

          {loading ? <p className="muted">Loading categories...</p> : null}
          {loadError ? <p className="notice">{loadError}</p> : null}
          {!loading && !loadError && !categories.length ? (
            <p className="muted">No categories available yet. Add categories from Admin panel.</p>
          ) : null}

          <div className="card-grid">
            {categories.map((category) => (
              <article
                key={category.id}
                className={`category-card ${selectedCategory === category.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <h3>{category.name}</h3>
                <p className="meta">{category.description}</p>
              </article>
            ))}
          </div>

          <div className="subtopic-slider" aria-label="Subtopics">
            {subtopics.map((subtopic) => (
              <button
                key={subtopic.id}
                type="button"
                className={`subtopic-pill ${selectedSubtopic === subtopic.id ? "active" : ""}`}
                onClick={() => setSelectedSubtopic(subtopic.id)}
              >
                {subtopic.name}
              </button>
            ))}
          </div>

          {selectedCategory && !subtopics.length ? (
            <p className="muted">No subtopics found for this category yet.</p>
          ) : null}
        </section>

        <section className="section" id="topics">
          <div className="label">Topics</div>
          <h2 className="h2">Select a Post</h2>
          <p className="body-txt">
            Search and open a topic. Users can read the first 20% without login, then a popup will ask for login.
          </p>

          <div className="search-row">
            <input
              type="search"
              placeholder="Search topics..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <button className="btn btn-outline" type="button" onClick={() => setSearchText("")}>
              Clear
            </button>
          </div>

          <div className="card-grid">
            {filteredPosts.map((post) => (
              <article key={post.id} className="post-card">
                <Image src={post.coverImage} alt={post.title} width={1200} height={800} />
                <h3>{post.title}</h3>
                <p className="meta">{post.excerpt}</p>
                <div className="tag-row">
                  {post.tags.map((tag) => (
                    <span className="tag" key={`${post.id}-${tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: "0.9rem" }}>
                  <Link href={`/post/${post.slug}`} className="btn btn-primary">
                    Open Post
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {!posts.length ? (
            <p className="muted">No published posts yet. Add posts from Admin panel.</p>
          ) : !filteredPosts.length ? (
            <p className="muted">No posts found for this filter.</p>
          ) : null}
        </section>

        <section className="section section-accent">
          <div className="label">Popular Topics</div>
          <h2 className="h2">Quick Start Chips</h2>
          <div className="chip-grid">
            {quickTopics.map((topic) => (
              <a key={topic} className="topic-chip" href="#topics">
                {topic}
              </a>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="label">Courses</div>
          <h2 className="h2">Go deeper with structured tracks</h2>
          <div className="course-grid">
            {courses.map((course) => (
              <article className="course-card" key={course.title}>
                <h3>{course.title}</h3>
                <p className="meta">{course.meta}</p>
                <span className="course-tag">{course.tag}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-block">
          <div className="cta-inner">
            <div className="label" style={{ color: "#fff" }}>
              Get Started Today
            </div>
            <h2>Start learning. It is completely free.</h2>
            <p>Pick any topic and start building your engineering knowledge right now.</p>
            <div className="hero-actions" style={{ justifyContent: "center" }}>
              <a className="btn btn-primary" href="#topics">
                Start with Basics
              </a>
              <a className="btn btn-outline" href="#subscribe" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.35)" }}>
                View Courses
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}


















