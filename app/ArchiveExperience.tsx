"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  archiveNodes,
  artifactRecords,
  chapters,
  type ArchiveNode,
  type ChapterId,
} from "./archive-data";

const STORAGE_KEY = "monuments-of-echoes:preferences";

type SavedPreferences = {
  soundEnabled?: boolean;
  reducedMotion?: boolean;
  hasVisited?: boolean;
  lastChapter?: ChapterId;
};

type TraceId = "idea" | "memory" | null;

const traceCopy = {
  idea: {
    code: "THOUGHT SOURCE // UNSTABLE",
    title: "思想并不消失。它们只是迁徙。",
    body: "风经过失效的花园，未完成的构思从石碑与叶片之间重新浮现。",
  },
  memory: {
    code: "MEMORY SOURCE // PARTIAL",
    title: "记忆保存那些拒绝消失的东西。",
    body: "水下档案只能恢复局部影像。远处有两枚核心以相同频率短暂闪烁。",
  },
};

function chapterIndex(id: ChapterId) {
  return chapters.findIndex((chapter) => chapter.id === id);
}

function EchoSeal({ resolved = false }: { resolved?: boolean }) {
  return (
    <div className={`echo-seal${resolved ? " is-resolved" : ""}`}>
      <span className="echo-axis" />
      <span className="echo-ring echo-ring-one" />
      <span className="echo-ring echo-ring-two" />
      <span className="echo-ring echo-ring-three" />
      <span className="echo-cut echo-cut-one" />
      <span className="echo-cut echo-cut-two" />
    </div>
  );
}

function SceneStage({
  scene,
  resolved,
}: {
  scene: string;
  resolved: boolean;
}) {
  const plate =
    scene === "wasteland" || scene === "relay"
      ? "wasteland"
      : scene === "nexus" || scene === "forge"
        ? "nexus"
        : scene === "identity"
          ? "identity"
          : "void";
  const dust = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        left: `${7 + ((index * 23) % 88)}%`,
        delay: `${(index % 7) * -1.3}s`,
        duration: `${8 + (index % 5) * 2}s`,
        size: `${1 + (index % 3)}px`,
      })),
    [],
  );

  return (
    <div className={`scene-stage scene-${scene}`} aria-hidden="true">
      <div className={`scene-image scene-image-${plate}`} key={plate} />
      <div className="scene-grade" />
      <div className="scene-horizon" />
      <div className="monument-axis" />
      <EchoSeal resolved={resolved} />

      <div className="relay-terminal">
        <span className="terminal-aerial" />
        <span className="terminal-screen">
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className="forge-aperture">
        <span />
        <span />
        <span />
      </div>

      <div className="dust-field">
        {dust.map((particle) => (
          <span
            key={particle.id}
            style={{
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}
      </div>
      <div className="scene-vignette" />
      <div className="scene-noise" />
    </div>
  );
}

export default function ArchiveExperience() {
  const [gateOpen, setGateOpen] = useState(true);
  const [indexOpen, setIndexOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);
  const [lastChapter, setLastChapter] = useState<ChapterId>("boot");
  const [selectedTrace, setSelectedTrace] = useState<TraceId>(null);
  const [relayRestored, setRelayRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const indexRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const currentChapter = chapters[currentIndex];

  const playPulse = useCallback(
    (frequency = 128) => {
      if (!soundEnabled || typeof window === "undefined") return;

      const audioWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextConstructor =
        window.AudioContext || audioWindow.webkitAudioContext;

      if (!AudioContextConstructor) return;

      const context = new AudioContextConstructor();
      const now = context.currentTime;

      [0, 0.18, 0.42].forEach((offset, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 0 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(
          frequency * (1 - index * 0.08),
          now + offset,
        );
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(
          0.038 / (index + 1),
          now + offset + 0.025,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + offset + 0.5,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.55);
      });

      window.setTimeout(() => void context.close(), 1200);
    },
    [soundEnabled],
  );

  const scrollToChapter = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(chapters.length - 1, index));
      sectionRefs.current[bounded]?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      setCurrentIndex(bounded);
    },
    [reducedMotion],
  );

  const openArchiveIndex = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    setGateOpen(false);
    setIndexOpen(true);
  }, []);

  const closeArchiveIndex = useCallback(() => {
    setIndexOpen(false);
    window.setTimeout(() => previousFocus.current?.focus(), 0);
  }, []);

  const startExperience = useCallback(
    (resume = false) => {
      const startIndex = resume ? Math.max(0, chapterIndex(lastChapter)) : 0;
      setGateOpen(false);
      setIndexOpen(false);
      window.setTimeout(() => scrollToChapter(startIndex), 30);
      playPulse(96);
    },
    [lastChapter, playPulse, scrollToChapter],
  );

  const chooseNode = useCallback(
    (node: ArchiveNode) => {
      if (node.status === "sealed") return;
      if (node.id === "idea" || node.id === "memory") {
        setSelectedTrace(node.id);
      }
      closeArchiveIndex();
      window.setTimeout(() => scrollToChapter(chapterIndex(node.target)), 30);
    },
    [closeArchiveIndex, scrollToChapter],
  );

  useEffect(() => {
    const systemReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let stored: SavedPreferences = {};

    try {
      stored = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) || "{}",
      ) as SavedPreferences;
    } catch {
      stored = {};
    }

    const timer = window.setTimeout(() => {
      setSoundEnabled(Boolean(stored.soundEnabled));
      setReducedMotion(
        typeof stored.reducedMotion === "boolean"
          ? stored.reducedMotion
          : systemReduced,
      );
      setHasVisited(Boolean(stored.hasVisited));
      if (
        stored.lastChapter &&
        chapters.some((chapter) => chapter.id === stored.lastChapter)
      ) {
        setLastChapter(stored.lastChapter);
      }
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const saved: SavedPreferences = {
      soundEnabled,
      reducedMotion,
      hasVisited: hasVisited || !gateOpen,
      lastChapter: currentChapter.id,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [
    currentChapter.id,
    gateOpen,
    hasVisited,
    ready,
    reducedMotion,
    soundEnabled,
  ]);

  useEffect(() => {
    document.body.classList.toggle("is-overlay-open", gateOpen || indexOpen);
    return () => document.body.classList.remove("is-overlay-open");
  }, [gateOpen, indexOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const nextIndex = Number(
          (visible.target as HTMLElement).dataset.chapterIndex,
        );
        if (!Number.isNaN(nextIndex)) setCurrentIndex(nextIndex);
      },
      { threshold: [0.42, 0.6, 0.78] },
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!indexOpen) return;
    window.setTimeout(
      () => indexRef.current?.querySelector<HTMLElement>(".index-close")?.focus(),
      0,
    );
  }, [indexOpen]);

  useEffect(() => {
    if (!indexOpen) return;

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !indexRef.current) return;
      const focusable = Array.from(
        indexRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("aria-hidden") && element.tabIndex >= 0,
      );

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", trapFocus);
    return () => window.removeEventListener("keydown", trapFocus);
  }, [indexOpen]);

  useEffect(() => {
    if (gateOpen || indexOpen) return;
    playPulse(102 + currentIndex * 18);
  }, [currentIndex, gateOpen, indexOpen, playPulse]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches(
          "input, textarea, select, [contenteditable='true'], [role='slider']",
        )
      ) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (indexOpen) closeArchiveIndex();
        else openArchiveIndex();
        return;
      }

      if (gateOpen || indexOpen) return;
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        scrollToChapter(currentIndex + 1);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        scrollToChapter(currentIndex - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    closeArchiveIndex,
    currentIndex,
    gateOpen,
    indexOpen,
    openArchiveIndex,
    scrollToChapter,
  ]);

  const progress = ((currentIndex + 1) / chapters.length) * 100;
  const resolved = currentChapter.id === "identity";

  return (
    <main className="archive-experience" id="main">
      <a className="skip-link" href="#chapter-boot">
        跳到档案叙事
      </a>

      <SceneStage scene={currentChapter.scene} resolved={resolved} />

      <header className="system-rail">
        <button
          className="brand-lockup"
          type="button"
          onClick={() => scrollToChapter(0)}
          aria-label="返回档案起点"
        >
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span>
            <strong>MONUMENTS OF ECHOES</strong>
            <small>回响纪念碑</small>
          </span>
        </button>

        <nav className="utility-nav" aria-label="全局控制">
          <button type="button" onClick={openArchiveIndex}>
            档案索引
          </button>
          <button
            type="button"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled((value) => !value)}
          >
            {soundEnabled ? "声音开启" : "声音关闭"}
          </button>
          <button
            type="button"
            aria-pressed={reducedMotion}
            onClick={() => setReducedMotion((value) => !value)}
          >
            {reducedMotion ? "简化动态" : "完整动态"}
          </button>
        </nav>
      </header>

      <div className="chapter-status" aria-hidden="true">
        <span>{currentChapter.sequence}</span>
        <div className="status-track">
          <i style={{ width: `${progress}%` }} />
        </div>
        <span>{String(chapters.length - 1).padStart(2, "0")}</span>
      </div>

      <div className="experience-scroll">
        {chapters.map((chapter, index) => (
          <section
            className={`chapter chapter-${chapter.id}`}
            data-chapter-index={index}
            id={`chapter-${chapter.id}`}
            key={chapter.id}
            ref={(node) => {
              sectionRefs.current[index] = node;
            }}
            aria-labelledby={`title-${chapter.id}`}
          >
            <div className="chapter-copy">
              <div className="chapter-meta">
                <span>ARCHIVE NODE / {chapter.sequence}</span>
                <span>{chapter.systemLabel}</span>
              </div>

              <h1 id={`title-${chapter.id}`}>
                <span>{chapter.titleEn}</span>
                {chapter.titleZh}
              </h1>

              <p>{chapter.description}</p>

              {chapter.quote && (
                <blockquote>
                  <span />
                  {chapter.quote}
                </blockquote>
              )}

              {chapter.id === "boot" && (
                <div className="system-readout" aria-label="档案状态">
                  <span>
                    ENVIRONMENT <b>ONLINE</b>
                  </span>
                  <span>
                    MEMORY <b>DEGRADED</b>
                  </span>
                  <span>
                    IDENTITY <b>FRAGMENTED</b>
                  </span>
                </div>
              )}

              {chapter.id === "relay" && (
                <div className="relay-actions">
                  <button
                    className={`restore-button${
                      relayRestored ? " is-restored" : ""
                    }`}
                    type="button"
                    onClick={() => {
                      setRelayRestored(true);
                      playPulse(188);
                    }}
                  >
                    <span>
                      {relayRestored
                        ? "CONNECTION RESTORED"
                        : "RESTORE CONNECTION"}
                    </span>
                    {relayRestored ? "远端链路已恢复" : "恢复连接"}
                  </button>
                  {relayRestored && (
                    <p className="restored-note" role="status">
                      HANDSHAKE / 01 · 一条微弱的通信痕迹已归档。
                    </p>
                  )}
                </div>
              )}

              {chapter.id === "nexus" && (
                <div className="trace-selector">
                  <div className="trace-buttons">
                    <button
                      type="button"
                      aria-pressed={selectedTrace === "idea"}
                      onClick={() => {
                        setSelectedTrace("idea");
                        playPulse(226);
                      }}
                    >
                      <span>THOUGHT / 02</span>
                      读取思想回响
                    </button>
                    <button
                      type="button"
                      aria-pressed={selectedTrace === "memory"}
                      onClick={() => {
                        setSelectedTrace("memory");
                        playPulse(164);
                      }}
                    >
                      <span>MEMORY / 03</span>
                      读取记忆回响
                    </button>
                  </div>
                  {selectedTrace && (
                    <div className="trace-result" role="status">
                      <span>{traceCopy[selectedTrace].code}</span>
                      <strong>{traceCopy[selectedTrace].title}</strong>
                      <p>{traceCopy[selectedTrace].body}</p>
                    </div>
                  )}
                  <div className="sealed-trace">
                    <span className="dual-ring" aria-hidden="true">
                      <i />
                      <i />
                    </span>
                    EMOTIONAL ARCHIVE / SEALED
                  </div>
                </div>
              )}

              {chapter.id === "forge" && (
                <div className="artifact-grid">
                  {artifactRecords.map((artifact) => (
                    <article key={artifact.code}>
                      <div>
                        <span>{artifact.code}</span>
                        <span>{artifact.category}</span>
                      </div>
                      <h2>{artifact.title}</h2>
                      <p>{artifact.description}</p>
                    </article>
                  ))}
                </div>
              )}

              {chapter.id === "identity" && (
                <div className="identity-record">
                  <div className="identity-portrait" aria-hidden="true">
                    <span />
                    <i />
                  </div>
                  <div className="identity-data">
                    <span>ARCHIVE SUBJECT / M-01</span>
                    <h2>个人创作者 · 开发者 · 世界构筑者</h2>
                    <p>
                      用设计、代码与长期记录，把仍在发生的生活整理成可以被再次发现的档案。
                    </p>
                    <div className="identity-status">
                      <span>SOURCE SIGNAL</span>
                      <strong>ACTIVE</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="chapter-actions">
                {index > 0 && (
                  <button
                    className="text-action"
                    type="button"
                    onClick={() => scrollToChapter(index - 1)}
                  >
                    返回上一节点
                  </button>
                )}
                {index < chapters.length - 1 ? (
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => scrollToChapter(index + 1)}
                  >
                    <span>CONTINUE RECOVERY</span>
                    继续恢复
                    <i aria-hidden="true">↓</i>
                  </button>
                ) : (
                  <>
                    <button
                      className="primary-action"
                      type="button"
                      onClick={() => scrollToChapter(chapterIndex("forge"))}
                    >
                      <span>VIEW CREATIONS</span>
                      查看创造记录
                      <i aria-hidden="true">↗</i>
                    </button>
                    <button
                      className="text-action"
                      type="button"
                      onClick={openArchiveIndex}
                    >
                      打开全部档案
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="chapter-announcer" aria-live="polite" aria-atomic="true">
        当前节点：{currentChapter.titleZh}
      </div>

      {gateOpen && (
        <div className="entry-gate">
          <div className="gate-backdrop" />
          <div className="gate-grid">
            <div className="gate-sigil">
              <EchoSeal />
              <span>ARCHIVE / M-01</span>
            </div>

            <div className="gate-copy">
              <p className="gate-kicker">A PERSONAL ARCHIVE AFTER HUMANITY</p>
              <h1>
                MONUMENTS
                <br />
                OF ECHOES
              </h1>
              <h2>回响纪念碑</h2>
              <p>
                一座在人类消失后仍在运行的个人档案遗迹。
                <br />
                进入废墟，恢复通信、思想、记忆、创造与身份。
              </p>

              <div className="gate-actions">
                <button
                  className="gate-primary"
                  type="button"
                  onClick={() => startExperience(false)}
                >
                  <span>BEGIN RECOVERY</span>
                  开始档案恢复
                  <i aria-hidden="true">→</i>
                </button>
                <button
                  className="gate-secondary"
                  type="button"
                  onClick={openArchiveIndex}
                >
                  <span>OPEN ARCHIVE INDEX</span>
                  直接打开档案索引
                </button>
                {ready && hasVisited && lastChapter !== "boot" && (
                  <button
                    className="resume-action"
                    type="button"
                    onClick={() => startExperience(true)}
                  >
                    发现上次恢复记录 · 从
                    {chapters[chapterIndex(lastChapter)]?.titleZh}继续
                  </button>
                )}
              </div>

              <div className="gate-preferences">
                <button
                  type="button"
                  aria-pressed={soundEnabled}
                  onClick={() => setSoundEnabled((value) => !value)}
                >
                  <span className="preference-dot" />
                  {soundEnabled ? "声音开启" : "静音进入"}
                </button>
                <button
                  type="button"
                  aria-pressed={reducedMotion}
                  onClick={() => setReducedMotion((value) => !value)}
                >
                  <span className="preference-dot" />
                  {reducedMotion ? "简化动态" : "完整动态"}
                </button>
                <span>典型主线约42秒 · 可随时跳过</span>
              </div>
            </div>

            <div className="gate-status" aria-hidden="true">
              <span>ENV / ONLINE</span>
              <span>MEM / DEGRADED</span>
              <span>IDN / FRAGMENTED</span>
            </div>
          </div>
        </div>
      )}

      <div
        className={`archive-index${indexOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal={indexOpen ? "true" : undefined}
        aria-hidden={!indexOpen}
        aria-labelledby="archive-index-title"
        ref={indexRef}
        tabIndex={-1}
      >
          <button
            className="index-backdrop"
            type="button"
            onClick={closeArchiveIndex}
            aria-label="关闭档案索引"
            tabIndex={-1}
          />
          <div className="index-panel">
            <div className="index-heading">
              <div>
                <span>DIRECTORY / PUBLIC RECORDS</span>
                <h2 id="archive-index-title">档案索引</h2>
                <p>公开档案无需完成主线即可访问。</p>
              </div>
              <button
                className="index-close"
                type="button"
                onClick={closeArchiveIndex}
              >
                关闭 <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="quick-access">
              <button
                type="button"
                onClick={() =>
                  chooseNode(
                    archiveNodes.find((node) => node.id === "works")!,
                  )
                }
              >
                <span>QUICK ACCESS / 01</span>
                <strong>查看作品与项目</strong>
                <i aria-hidden="true">↗</i>
              </button>
              <button
                type="button"
                onClick={() =>
                  chooseNode(
                    archiveNodes.find((node) => node.id === "about")!,
                  )
                }
              >
                <span>QUICK ACCESS / 02</span>
                <strong>身份与联系</strong>
                <i aria-hidden="true">↗</i>
              </button>
            </div>

            <div className="index-list">
              {archiveNodes.map((node) =>
                node.status === "sealed" ? (
                  <div
                    className="index-node is-sealed"
                    key={node.id}
                    aria-disabled="true"
                  >
                    <span className="node-code">{node.code}</span>
                    <div>
                      <strong>{node.title}</strong>
                      <span>{node.english}</span>
                      <p>{node.summary}</p>
                    </div>
                    <span className="node-status">{node.status}</span>
                  </div>
                ) : (
                  <button
                    className="index-node"
                    key={node.id}
                    type="button"
                    onClick={() => chooseNode(node)}
                  >
                    <span className="node-code">{node.code}</span>
                    <div>
                      <strong>{node.title}</strong>
                      <span>{node.english}</span>
                      <p>{node.summary}</p>
                    </div>
                    <span className="node-status">{node.status}</span>
                  </button>
                ),
              )}
            </div>

            <div className="index-footer">
              <span>ESC / CLOSE</span>
              <button
                type="button"
                onClick={() => {
                  closeArchiveIndex();
                  window.setTimeout(() => scrollToChapter(0), 30);
                }}
              >
                从头进入沉浸叙事
              </button>
            </div>
          </div>
      </div>
    </main>
  );
}
