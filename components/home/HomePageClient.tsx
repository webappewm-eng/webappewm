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
import { getCategories, getCourses, getHeroMedia, getPosts, getSiteSettings, getSubtopics, getWebinars } from "@/lib/firebase/data";
import { Category, Course, HeroMediaItem, Post, Subtopic, Webinar } from "@/lib/types";

const fallbackVideoSlides: HeroMediaItem[] = [
  {
    id: "video-1",
    section: "video",
    title: "Real circuit walkthrough",
    source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    order: 1,
    enabled: true,
    updatedAt: ""
  },
  {
    id: "video-2",
    section: "video",
    title: "Hands-on component demo",
    source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    order: 2,
    enabled: true,
    updatedAt: ""
  }
];

const fallbackImageSlides: HeroMediaItem[] = [
  {
    id: "img-1",
    section: "image",
    title: "Build from fundamentals",
    source: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=80",
    order: 1,
    enabled: true,
    updatedAt: ""
  },
  {
    id: "img-2",
    section: "image",
    title: "Practical electronics learning",
    source: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    order: 2,
    enabled: true,
    updatedAt: ""
  },
  {
    id: "img-3",
    section: "image",
    title: "From theory to projects",
    source: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    order: 3,
    enabled: true,
    updatedAt: ""
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

function isExternalHref(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

interface HomePageClientProps {
  initialCategories: Category[];
  initialSubtopics: Subtopic[];
  initialPosts: Post[];
  initialVideoSlides: HeroMediaItem[];
  initialImageSlides: HeroMediaItem[];
  initialWebinars: Webinar[];
  initialCourses: Course[];
  initialPreviewPercent: number;
  initialHeroVideoSliderEnabled: boolean;
  initialHeroImageSliderEnabled: boolean;
  requestedCategory?: string;
  requestedSubtopic?: string;
  requestedSearch?: string;
}

export default function HomePageClient({
  initialCategories,
  initialSubtopics,
  initialPosts,
  initialVideoSlides,
  initialImageSlides,
  initialWebinars,
  initialCourses,
  initialPreviewPercent,
  initialHeroVideoSliderEnabled,
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
  const [webinars, setWebinars] = useState<Webinar[]>(initialWebinars.filter((item) => item.showOnHome));
  const [coursesData, setCoursesData] = useState<Course[]>(initialCourses);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialSelectedCategory);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [searchText, setSearchText] = useState(requestedSearch);

  const [videoSlides, setVideoSlides] = useState<HeroMediaItem[]>(initialVideoSlides.length ? initialVideoSlides : fallbackVideoSlides);
  const [imageSlides, setImageSlides] = useState<HeroMediaItem[]>(initialImageSlides.length ? initialImageSlides : fallbackImageSlides);
  const [previewPercent, setPreviewPercent] = useState(initialPreviewPercent || 20);
  const [heroVideoSliderEnabled, setHeroVideoSliderEnabled] = useState(initialHeroVideoSliderEnabled);
  const [heroImageSliderEnabled, setHeroImageSliderEnabled] = useState(initialHeroImageSliderEnabled);

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
        const [nextCategories, nextSubtopics, nextPosts, nextVideoSlides, nextImageSlides, siteSettings, nextWebinars, nextCourses] = await Promise.all([
          getCategories(),
          getSubtopics(),
          getPosts(),
          getHeroMedia("video"),
          getHeroMedia("image"),
          getSiteSettings(),
          getWebinars(false),
          getCourses(false)
        ]);

        setCategories(nextCategories);
        setAllSubtopics(nextSubtopics);
        setPosts(nextPosts);
        setVideoSlides(nextVideoSlides.length ? nextVideoSlides : fallbackVideoSlides);
        setImageSlides(nextImageSlides.length ? nextImageSlides : fallbackImageSlides);
        setPreviewPercent(siteSettings.contentPreviewPercent);
        setHeroVideoSliderEnabled(siteSettings.heroVideoSliderEnabled);
        setHeroImageSliderEnabled(siteSettings.heroImageSliderEnabled);
        setWebinars(nextWebinars.filter((item) => item.showOnHome));
        setCoursesData(nextCourses);
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
    if (videoSlides.length <= 1 && imageSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setVideoIndex((prev) => (videoSlides.length ? (prev + 1) % videoSlides.length : 0));
      setImageIndex((prev) => (imageSlides.length ? (prev + 1) % imageSlides.length : 0));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [videoSlides, imageSlides]);

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

  const currentVideoSlide = videoSlides[videoIndex] ?? fallbackVideoSlides[0];
  const currentImageSlide = imageSlides[imageIndex] ?? fallbackImageSlides[0];
  const activeHeroSlides = Number(heroVideoSliderEnabled) + Number(heroImageSliderEnabled);

  return (
    <div className="app-shell">
      <Header onOpenLogin={() => setLoginOpen(true)} searchValue={searchText} onSearchChange={setSearchText} />
      <main className="page-main">
        <NotificationStrip />

        <section className="hero">
          <div className="hero-inner hero-inner-stacked">
            {activeHeroSlides ? (
              <div className="hero-slider-wrap hero-slider-top hero-slider-full">
                {heroVideoSliderEnabled ? (
                  <div className="slider-box">
                    <div className="slide slide-hero-wide">
                      {currentVideoSlide ? (
                        currentVideoSlide.redirectUrl ? (
                          isExternalHref(currentVideoSlide.redirectUrl) ? (
                            <a className="slide-media-link" href={currentVideoSlide.redirectUrl} target="_blank" rel="noreferrer">
                              <video key={currentVideoSlide.id} src={currentVideoSlide.source} autoPlay muted loop playsInline />
                              <span className="slide-caption">{currentVideoSlide.title}</span>
                            </a>
                          ) : (
                            <Link className="slide-media-link" href={currentVideoSlide.redirectUrl}>
                              <video key={currentVideoSlide.id} src={currentVideoSlide.source} autoPlay muted loop playsInline />
                              <span className="slide-caption">{currentVideoSlide.title}</span>
                            </Link>
                          )
                        ) : (
                          <>
                            <video key={currentVideoSlide.id} src={currentVideoSlide.source} autoPlay muted loop playsInline />
                            <span className="slide-caption">{currentVideoSlide.title}</span>
                          </>
                        )
                      ) : (
                        <div className="notice">No video media configured yet.</div>
                      )}
                    </div>
                  </div>
                ) : null}

                {heroImageSliderEnabled ? (
                  <div className="slider-box">
                    <div className="slide slide-hero-wide">
                      {currentImageSlide ? (
                        currentImageSlide.redirectUrl ? (
                          isExternalHref(currentImageSlide.redirectUrl) ? (
                            <a className="slide-media-link" href={currentImageSlide.redirectUrl} target="_blank" rel="noreferrer">
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
                            <Link className="slide-media-link" href={currentImageSlide.redirectUrl}>
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
                        ) : (
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
                        )
                      ) : (
                        <div className="notice">No image media configured yet.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="notice">Hero media sliders are currently disabled in admin settings.</div>
            )}

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

        <section className="section section-accent">
          <div className="label">Popular Topics</div>
          <h2 className="h2">Quick Start Chips</h2>
          <div className="chip-grid">
            {quickTopics.map((topic) => (
              <Link key={topic} className="topic-chip" href="/community">
                {topic}
              </Link>
            ))}
          </div>
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

        <section className="section">
          <div className="label">Certification Courses</div>
          <h2 className="h2">Go deeper with structured tracks</h2>
          <div className="course-grid-home">
            {coursesData.length ? (
              coursesData.map((course) => (
                <article className="course-home-card" key={course.id}>
                  <h3>{course.title}</h3>
                  <p className="meta">{course.lessons.length} lessons</p>
                  <p className="muted">{course.description}</p>
                  <Link href={`/courses/${course.slug}`} className="btn btn-outline" style={{ marginTop: "0.8rem" }}>
                    Start Course
                  </Link>
                </article>
              ))
            ) : (
              courses.map((course) => (
                <article className="course-home-card" key={course.title}>
                  <h3>{course.title}</h3>
                  <p className="meta">{course.meta}</p>
                  <span className="course-tag">{course.tag}</span>
                </article>
              ))
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

