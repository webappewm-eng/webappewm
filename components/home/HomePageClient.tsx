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
import { getCategories, getHeroMedia, getLandingTopics, getPosts, getSiteSettings, getSubtopics, getWebinars } from "@/lib/firebase/data";
import { Category, HeroMediaItem, LandingTopic, Post, Subtopic, Webinar } from "@/lib/types";

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

const FALLBACK_POST_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";

function getSafeImageSrc(value: string | undefined): string {
  const src = (value ?? "").trim();
  if (!src) {
    return FALLBACK_POST_IMAGE;
  }
  if (src.startsWith("/") || /^https?:\/\//i.test(src)) {
    return src;
  }
  return FALLBACK_POST_IMAGE;
}

function resolveSlideHref(value: string): { href: string; external: boolean } {
  const next = value.trim();
  if (!next) {
    return { href: "", external: false };
  }
  if (/^https?:\/\//i.test(next)) {
    return { href: next, external: true };
  }
  if (/^\/[a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(next)) {
    return { href: `https://${next.replace(/^\/+/, "")}`, external: true };
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(next)) {
    return { href: `https://${next}`, external: true };
  }
  return { href: next, external: false };
}

interface HomePageClientProps {
  initialCategories: Category[];
  initialSubtopics: Subtopic[];
  initialPosts: Post[];
  initialImageSlides: HeroMediaItem[];
  initialLandingTopics: LandingTopic[];
  initialWebinars: Webinar[];
  initialPreviewPercent: number;
  initialHeroImageSliderEnabled: boolean;
  requestedCategory?: string;
  requestedSubtopic?: string;
  requestedSearch?: string;
}

export default function HomePageClient({
  initialCategories,
  initialSubtopics,
  initialPosts,
  initialImageSlides,
  initialLandingTopics,
  initialWebinars,
  initialPreviewPercent,
  initialHeroImageSliderEnabled,
  requestedCategory = "",
  requestedSubtopic = "",
  requestedSearch = ""
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
  const [landingTopics, setLandingTopics] = useState<LandingTopic[]>(initialLandingTopics);
  const [webinars, setWebinars] = useState<Webinar[]>(initialWebinars.filter((item) => item.showOnHome));

  const [selectedCategory, setSelectedCategory] = useState<string>(initialSelectedCategory);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [searchText, setSearchText] = useState(requestedSearch);
  const [imageSlides, setImageSlides] = useState<HeroMediaItem[]>(initialImageSlides);
  const [previewPercent, setPreviewPercent] = useState(initialPreviewPercent || 20);
  const [heroImageSliderEnabled, setHeroImageSliderEnabled] = useState(initialHeroImageSliderEnabled);
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

  const browseTopics = useMemo(() => {
    return landingTopics
      .filter((item) => item.showOnHome !== false)
      .map((item) => ({
        id: item.id,
        name: item.title,
        href: `/topic/${encodeURIComponent(item.slug)}`,
        categoryName: "Landing Topic"
      }));
  }, [landingTopics]);
  useEffect(() => {
    async function refreshFromFirebase() {
      try {
        const [nextCategories, nextSubtopics, nextPosts, nextImageSlides, nextLandingTopics, siteSettings, nextWebinars] = await Promise.all([
          getCategories(),
          getSubtopics(),
          getPosts(),
          getHeroMedia("image"),
          getLandingTopics(false),
          getSiteSettings(),
          getWebinars(false)
        ]);

        setCategories(nextCategories);
        setAllSubtopics(nextSubtopics);
        setPosts(nextPosts);
        setImageSlides(nextImageSlides);
        setLandingTopics(nextLandingTopics);
        setPreviewPercent(siteSettings.contentPreviewPercent);
        setHeroImageSliderEnabled(siteSettings.heroImageSliderEnabled);
        setWebinars(nextWebinars.filter((item) => item.showOnHome));
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
    if (imageSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setImageIndex((prev) => (imageSlides.length ? (prev + 1) % imageSlides.length : 0));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [imageSlides]);
  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll(".reveal"));
    if (!reveals.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("vis");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    reveals.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
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
  const currentImageSlide = imageSlides[imageIndex];
  const currentImageSlideLink = currentImageSlide?.redirectUrl ? resolveSlideHref(currentImageSlide.redirectUrl) : null;
  const showHeroImageSlider = heroImageSliderEnabled && Boolean(currentImageSlide);

  return (
    <div className="app-shell">
      <Header onOpenLogin={() => setLoginOpen(true)} searchValue={searchText} onSearchChange={setSearchText} />
      <main className="page-main">
        <NotificationStrip />

        <section className="hero">
          <div className="hero-inner hero-inner-stacked">
                        {showHeroImageSlider ? (
              <div className="hero-slider-wrap hero-slider-top hero-slider-full">
                <div className="slider-box">
                  <div className="slide slide-hero-wide">
                    {currentImageSlideLink?.href ? (
                      currentImageSlideLink.external ? (
                        <a className="slide-media-link" href={currentImageSlideLink.href} target="_blank" rel="noreferrer">
                          <Image
                            key={currentImageSlide.id}
                            src={currentImageSlide.source}
                            alt={currentImageSlide.title}
                            width={1600}
                            height={900}
                          />
                          <span className="slide-caption">{currentImageSlide.title}</span>
                        </a>
                      ) : (
                        <Link className="slide-media-link" href={currentImageSlideLink.href}>
                          <Image
                            key={currentImageSlide.id}
                            src={currentImageSlide.source}
                            alt={currentImageSlide.title}
                            width={1600}
                            height={900}
                          />
                          <span className="slide-caption">{currentImageSlide.title}</span>
                        </Link>
                      )
                    ) : currentImageSlide ? (
                      <>
                        <Image
                          key={currentImageSlide.id}
                          src={currentImageSlide.source}
                          alt={currentImageSlide.title}
                          width={1600}
                          height={900}
                        />
                        <span className="slide-caption">{currentImageSlide.title}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="hero-main-row">
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
                  <Link className="btn btn-primary" href="/courses">
                    Start Learning Free
                  </Link>
                  <Link className="btn btn-outline" href="/community">
                    View Community
                  </Link>
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

              <div className="slider-box hero-circuit-box">
                <p className="slider-label">Circuit Visual</p>
                <div className="slide slide-svg">
                  <HeroCircuitVisual />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-soft reveal" id="how-it-works">
          <div className="section-soft-inner">
            <div className="label">How It Works</div>
          <h2 className="h2">Learn by <span>doing</span>, not memorising</h2>
          <p className="body-txt">Every topic takes you from zero to understanding with animations that show, not just tell.</p>
          <div className="steps">
            <article className="step d1">
              <div className="step-num">01</div>
              <h3>Read the concept</h3>
              <p>Plain-English explanations with real-world analogies. No jargon and no assumed knowledge.</p>
            </article>
            <article className="step d2">
              <div className="step-num">02</div>
              <h3>Watch it animate</h3>
              <p>See signals and behavior visually so each concept is clear before you move ahead.</p>
            </article>
            <article className="step d3">
              <div className="step-num">03</div>
              <h3>Break it interactively</h3>
              <p>Change values, test outcomes, and learn by trying instead of memorising theory only.</p>
            </article>
          </div>
                  </div>
        </section>

        <section className="section reveal" id="learning-paths">
          <div className="label">Learning Paths</div>
          <h2 className="h2">Six foundations of <span>every engineer</span></h2>
          <p className="body-txt">Master all six and build cross-disciplinary understanding from day one.</p>
          <div className="paths">
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

        <section className="section section-soft reveal" id="live-preview">
          <div className="section-soft-inner">
            <div className="label">Live Preview</div>
          <h2 className="h2">See it <span>in action</span></h2>
          <p className="body-txt">Every topic includes an interactive explanation block like this.</p>
          <AnimationShowcase />
          </div>
        </section>

        <section className="section reveal" id="browse-topics">
          <div className="label">Browse Topics</div>
          <h2 className="h2">Start with anything</h2>
          <p className="body-txt">Topics shown here come from Admin Topics. Enable "Show in Home Browse Topics" when creating a topic.</p>
          <div className="topics-grid">
            {browseTopics.length ? (
              browseTopics.map((topic) => (
                <Link key={topic.id} className="topic-chip topic-chip-card" href={topic.href}>
                  <span className="name">{topic.name}</span>
                  <span className="cat">{topic.categoryName}</span>
                </Link>
              ))
            ) : (
              <p className="muted">No topics selected for home browse yet.</p>
            )}
          </div>
        </section>
        <section className="section section-accent" id="categories" hidden>
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

        <section className="section" id="topics" hidden>
          <div className="label">Topics</div>
          <h2 className="h2">Select a Post</h2>
          <p className="body-txt">
            Search and open a topic. Users can preview {previewPercent}% without login, then a popup asks for login.
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
              <article key={post.id} className="post-card post-card-clickable">
                <Link href={`/post/${post.slug}`} className="post-card-link">
                  <Image src={getSafeImageSrc(post.coverImage)} alt={post.title} width={1200} height={800} />
                  <h3>{post.title}</h3>
                  <p className="meta">{post.excerpt}</p>
                </Link>
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

        <section className="section section-accent" hidden>
          <div className="label">Webinars</div>
          <h2 className="h2">Upcoming live webinars</h2>
          <p className="body-txt">Register for live sessions and track registrations from admin panel.</p>
          <div className="webinar-grid">
            {webinars.length ? (
              webinars.map((webinar) => (
                <article className="webinar-card" key={webinar.id}>
                  <h3>{webinar.title}</h3>
                  <p className="meta">{new Date(webinar.startAt).toLocaleString()}</p>
                  <p className="muted">{webinar.description}</p>
                  <Link href={`/webinars/${webinar.slug}`} className="btn btn-outline" style={{ marginTop: "0.8rem" }}>
                    Register
                  </Link>
                </article>
              ))
            ) : (
              <article className="webinar-card">
                <h3>More webinars coming soon</h3>
                <p className="muted">Add webinars from admin panel to show here.</p>
                <Link href="/webinars" className="btn btn-outline" style={{ marginTop: "0.8rem" }}>
                  Open Webinar Page
                </Link>
              </article>
            )}
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
              <Link className="btn btn-primary" href="/community">
                Start with Basics
              </Link>
              <Link className="btn btn-outline" href="/courses" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.35)" }}>
                View Courses
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}






