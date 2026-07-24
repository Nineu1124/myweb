"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  archiveNodes,
  artifactRecords,
  chapters,
  nexusBranches,
  type ArchiveNode,
  type ChapterId,
  type NexusBranchId,
} from "./archive-data";

const STORAGE_KEY = "monuments-of-echoes:preferences";
const NEXUS_DWELL_MS = 560;

type SavedPreferences = {
  soundEnabled?: boolean;
  reducedMotion?: boolean;
  hasVisited?: boolean;
  lastChapter?: ChapterId;
};

function chapterIndex(id: ChapterId) {
  return chapters.findIndex((chapter) => chapter.id === id);
}

function branchById(id: NexusBranchId) {
  return nexusBranches.find((branch) => branch.id === id)!;
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
  const [activeBranch, setActiveBranch] = useState<NexusBranchId | null>(null);
  const [nexusPreview, setNexusPreview] = useState<NexusBranchId | null>(null);
  const [nexusDwell, setNexusDwell] = useState<NexusBranchId | null>(null);
  const [relayRestored, setRelayRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const indexRef = useRef<HTMLDivElement | null>(null);
  const branchHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const wheelAccumulatorRef = useRef(0);
  const wheelResetRef = useRef<number | null>(null);
  const wheelLockedRef = useRef(false);
  const nexusPreviewRef = useRef<NexusBranchId | null>(null);
  const nexusDwellRef = useRef<NexusBranchId | null>(null);
  const nexusHoverTimerRef = useRef<number | null>(null);
  const nexusHoverAnchorRef = useRef<{ x: number; y: number } | null>(null);
  const nexusHoverArmedRef = useRef(true);
  const currentChapter = chapters[currentIndex];
  const publicArchiveNodes = useMemo(
    () => archiveNodes.filter((node) => node.visibility === "public"),
    [],
  );
  const compassUnlocked =
    hasVisited || currentIndex >= chapterIndex("nexus");

  const resetNexusSensing = useCallback((armed = true) => {
    if (nexusHoverTimerRef.current) {
      window.clearTimeout(nexusHoverTimerRef.current);
      nexusHoverTimerRef.current = null;
    }
    nexusHoverAnchorRef.current = null;
    nexusHoverArmedRef.current = armed;

    if (nexusPreviewRef.current !== null) {
      nexusPreviewRef.current = null;
      setNexusPreview(null);
    }
    if (nexusDwellRef.current !== null) {
      nexusDwellRef.current = null;
      setNexusDwell(null);
    }
  }, []);

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
      resetNexusSensing(true);
      setActiveBranch(null);
      sectionRefs.current[bounded]?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      setCurrentIndex(bounded);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("branch");
        url.hash = `chapter-${chapters[bounded].id}`;
        window.history.replaceState(null, "", url);
      }
    },
    [reducedMotion, resetNexusSensing],
  );

  const openBranch = useCallback(
    (branch: NexusBranchId, moveFocus = false) => {
      resetNexusSensing(false);
      setActiveBranch(branch);
      playPulse(branch === "memory" ? 164 : 226);

      const url = new URL(window.location.href);
      url.searchParams.set("branch", branch);
      url.hash = "chapter-nexus";
      window.history.replaceState(null, "", url);

      if (moveFocus) {
        window.setTimeout(() => branchHeadingRef.current?.focus(), 80);
      }
    },
    [playPulse, resetNexusSensing],
  );

  const closeBranch = useCallback(() => {
    resetNexusSensing(false);
    setActiveBranch(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("branch");
    url.hash = "chapter-nexus";
    window.history.replaceState(null, "", url);
  }, [resetNexusSensing]);

  const handleNexusPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (
        !event.isPrimary ||
        event.pointerType !== "mouse" ||
        currentChapter.id !== "nexus" ||
        gateOpen ||
        indexOpen ||
        activeBranch ||
        dragStartRef.current ||
        (event.target as HTMLElement).closest(
          "button, a, input, textarea, select, [contenteditable='true']",
        )
      ) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const localX = event.clientX - bounds.left;
      const localY = event.clientY - bounds.top;
      const ratioX = localX / bounds.width;
      const ratioY = localY / bounds.height;
      const previewTarget =
        ratioX <= 0.24 ? "memory" : ratioX >= 0.76 ? "idea" : null;

      if (!nexusHoverArmedRef.current) {
        if (ratioX > 0.34 && ratioX < 0.66) {
          nexusHoverArmedRef.current = true;
        } else {
          resetNexusSensing(false);
          return;
        }
      }

      if (nexusPreviewRef.current !== previewTarget) {
        nexusPreviewRef.current = previewTarget;
        setNexusPreview(previewTarget);
      }

      const edgeWidth = Math.min(160, Math.max(90, bounds.width * 0.08));
      const insideVerticalField = ratioY >= 0.14 && ratioY <= 0.86;
      const dwellTarget = insideVerticalField
        ? localX <= edgeWidth
          ? "memory"
          : localX >= bounds.width - edgeWidth
            ? "idea"
            : null
        : null;

      const clearDwell = () => {
        if (nexusHoverTimerRef.current) {
          window.clearTimeout(nexusHoverTimerRef.current);
          nexusHoverTimerRef.current = null;
        }
        nexusHoverAnchorRef.current = null;
        if (nexusDwellRef.current !== null) {
          nexusDwellRef.current = null;
          setNexusDwell(null);
        }
      };

      if (!dwellTarget) {
        clearDwell();
        return;
      }

      const anchor = nexusHoverAnchorRef.current;
      const movedFromAnchor = anchor
        ? Math.hypot(event.clientX - anchor.x, event.clientY - anchor.y)
        : Number.POSITIVE_INFINITY;
      const needsNewDwell =
        nexusDwellRef.current !== dwellTarget || movedFromAnchor > 18;

      if (!needsNewDwell) return;

      clearDwell();
      nexusDwellRef.current = dwellTarget;
      setNexusDwell(dwellTarget);
      nexusHoverAnchorRef.current = { x: event.clientX, y: event.clientY };
      nexusHoverTimerRef.current = window.setTimeout(() => {
        nexusHoverArmedRef.current = false;
        openBranch(dwellTarget, false);
      }, NEXUS_DWELL_MS);
    },
    [
      activeBranch,
      currentChapter.id,
      gateOpen,
      indexOpen,
      openBranch,
      resetNexusSensing,
    ],
  );

  const handleDirectionalPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (
        currentChapter.id !== "nexus" ||
        activeBranch ||
        !event.isPrimary ||
        (event.pointerType !== "touch" && event.pointerType !== "pen") ||
        event.button !== 0 ||
        (event.target as HTMLElement).closest("button, a")
      ) {
        return;
      }

      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [activeBranch, currentChapter.id],
  );

  const handleDirectionalPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (!start || start.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      if (Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) {
        return;
      }

      openBranch(deltaX > 0 ? "memory" : "idea");
    },
    [openBranch],
  );

  const openArchiveIndex = useCallback(() => {
    resetNexusSensing(true);
    previousFocus.current = document.activeElement as HTMLElement | null;
    setGateOpen(false);
    setActiveBranch(null);
    setIndexOpen(true);
  }, [resetNexusSensing]);

  const closeArchiveIndex = useCallback(() => {
    setIndexOpen(false);
    window.setTimeout(() => previousFocus.current?.focus(), 0);
  }, []);

  const startExperience = useCallback(
    (resume = false) => {
      const startIndex = resume ? Math.max(0, chapterIndex(lastChapter)) : 0;
      setGateOpen(false);
      setIndexOpen(false);
      setActiveBranch(null);
      window.setTimeout(() => scrollToChapter(startIndex), 30);
      playPulse(96);
    },
    [lastChapter, playPulse, scrollToChapter],
  );

  const chooseNode = useCallback(
    (node: ArchiveNode) => {
      if (node.status === "sealed") return;
      const branch =
        node.id === "idea" || node.id === "memory" ? node.id : null;
      closeArchiveIndex();
      window.setTimeout(() => {
        scrollToChapter(chapterIndex(node.target));
        if (branch) window.setTimeout(() => openBranch(branch), 420);
      }, 30);
    },
    [closeArchiveIndex, openBranch, scrollToChapter],
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
    const overlayOpen = gateOpen || indexOpen || Boolean(activeBranch);
    document.documentElement.classList.toggle("is-overlay-open", overlayOpen);
    document.body.classList.toggle("is-overlay-open", overlayOpen);
    return () => {
      document.documentElement.classList.remove("is-overlay-open");
      document.body.classList.remove("is-overlay-open");
    };
  }, [activeBranch, gateOpen, indexOpen]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
    return () => {
      delete document.documentElement.dataset.reducedMotion;
    };
  }, [reducedMotion]);

  useEffect(() => {
    const cancelPendingSensing = () =>
      resetNexusSensing(nexusHoverArmedRef.current);
    window.addEventListener("blur", cancelPendingSensing);
    return () => {
      window.removeEventListener("blur", cancelPendingSensing);
      if (nexusHoverTimerRef.current) {
        window.clearTimeout(nexusHoverTimerRef.current);
      }
    };
  }, [resetNexusSensing]);

  useEffect(() => {
    if (!ready || !window.location.hash.startsWith("#chapter-")) return;

    const chapterId = window.location.hash.replace(
      "#chapter-",
      "",
    ) as ChapterId;
    const nextIndex = chapterIndex(chapterId);
    if (nextIndex < 0) return;

    const branch = new URL(window.location.href).searchParams.get("branch");
    const restoreTimer = window.setTimeout(() => {
      setGateOpen(false);
      setHasVisited(true);
      setCurrentIndex(nextIndex);
      sectionRefs.current[nextIndex]?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });

      if (
        chapterId === "nexus" &&
        (branch === "memory" || branch === "idea")
      ) {
        setActiveBranch(branch);
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [ready]);

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
    if (
      gateOpen ||
      indexOpen ||
      activeBranch ||
      currentChapter.id !== "nexus"
    ) {
      wheelAccumulatorRef.current = 0;
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        (event.target as HTMLElement).closest("button, a, input, textarea")
      ) {
        return;
      }

      const scale =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? window.innerWidth
            : 1;
      const horizontalDelta =
        (event.shiftKey ? event.deltaY : event.deltaX) * scale;
      const verticalDelta = event.deltaY * scale;
      const horizontalIntent =
        event.shiftKey ||
        Math.abs(horizontalDelta) > Math.abs(verticalDelta) * 1.25;

      if (!horizontalIntent || Math.abs(horizontalDelta) < 2) return;
      event.preventDefault();
      if (wheelLockedRef.current) return;

      wheelAccumulatorRef.current += horizontalDelta;
      if (wheelResetRef.current) window.clearTimeout(wheelResetRef.current);
      wheelResetRef.current = window.setTimeout(() => {
        wheelAccumulatorRef.current = 0;
      }, 160);

      if (Math.abs(wheelAccumulatorRef.current) < 60) return;

      wheelLockedRef.current = true;
      openBranch(wheelAccumulatorRef.current > 0 ? "idea" : "memory");
      wheelAccumulatorRef.current = 0;
      window.setTimeout(() => {
        wheelLockedRef.current = false;
      }, 700);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (wheelResetRef.current) window.clearTimeout(wheelResetRef.current);
    };
  }, [activeBranch, currentChapter.id, gateOpen, indexOpen, openBranch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.key !== "Escape" &&
        target?.matches(
          "button, a, input, textarea, select, [contenteditable='true'], [role='button'], [role='slider']",
        )
      ) {
        return;
      }

      if (event.key === "Escape") {
        if (!activeBranch && !indexOpen) return;
        event.preventDefault();
        if (activeBranch) closeBranch();
        else closeArchiveIndex();
        return;
      }

      if (gateOpen || indexOpen) return;

      if (activeBranch) {
        if (
          (activeBranch === "memory" && event.key === "ArrowRight") ||
          (activeBranch === "idea" && event.key === "ArrowLeft")
        ) {
          event.preventDefault();
          closeBranch();
        }
        return;
      }

      if (currentChapter.id === "nexus" && event.key === "ArrowLeft") {
        event.preventDefault();
        openBranch("memory", true);
        return;
      }

      if (currentChapter.id === "nexus" && event.key === "ArrowRight") {
        event.preventDefault();
        openBranch("idea", true);
        return;
      }

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
    activeBranch,
    closeArchiveIndex,
    closeBranch,
    currentIndex,
    currentChapter.id,
    gateOpen,
    indexOpen,
    openBranch,
    scrollToChapter,
  ]);

  const progress = ((currentIndex + 1) / chapters.length) * 100;
  const resolved = currentChapter.id === "identity";
  const currentBranch = activeBranch ? branchById(activeBranch) : null;

  return (
    <main
      className={`archive-experience${
        nexusPreview ? ` is-nexus-preview-${nexusPreview}` : ""
      }`}
      id="main"
    >
      <a className="skip-link" href="#chapter-boot">
        跳到档案叙事
      </a>

      <SceneStage scene={currentChapter.scene} resolved={resolved} />

      {currentChapter.id === "nexus" && !activeBranch && (
        <div
          className={`nexus-preview-stage${
            nexusPreview ? ` is-${nexusPreview}` : ""
          }`}
          aria-hidden="true"
        >
          <div className="nexus-preview-image nexus-preview-memory" />
          <div className="nexus-preview-image nexus-preview-idea" />
          <div className="nexus-preview-grade" />
        </div>
      )}

      <div
        className={`scene-telemetry telemetry-${currentChapter.id}`}
        aria-hidden="true"
      >
        <span>ARCHIVE VECTOR / {currentChapter.sequence}</span>
        <div className="telemetry-orbit">
          <i />
          <i />
          <i />
          <b />
        </div>
        <p>{currentChapter.systemLabel}</p>
        <small>LAT / UNKNOWN · ERA / UNRESOLVED</small>
      </div>

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

      <button
        className={`oracle-compass${compassUnlocked ? " is-unlocked" : ""}`}
        type="button"
        onClick={openArchiveIndex}
        disabled={!compassUnlocked}
        aria-label={
          compassUnlocked
            ? "打开神谕罗盘与档案索引"
            : "神谕罗盘将在中央遗迹解锁"
        }
      >
        <span className="oracle-rings" aria-hidden="true">
          <i />
          <i />
          <i />
          <b />
        </span>
        <span className="oracle-label">
          <small>{compassUnlocked ? "ORACLE COMPASS" : "NODE LOCKED"}</small>
          <strong>{compassUnlocked ? "档案导航" : "抵达中央遗迹后解锁"}</strong>
        </span>
      </button>

      <div
        className={`input-legend${
          currentChapter.id === "nexus" ? " is-directional" : ""
        }`}
        aria-hidden="true"
      >
        <span>↑ ↓ 主线</span>
        <i />
        <span>← → 分支</span>
      </div>

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
            className={`chapter chapter-${chapter.id}${
              chapter.id === "nexus" ? " is-directional" : ""
            }`}
            data-chapter-index={index}
            id={`chapter-${chapter.id}`}
            key={chapter.id}
            ref={(node) => {
              sectionRefs.current[index] = node;
            }}
            aria-labelledby={`title-${chapter.id}`}
            aria-roledescription={
              chapter.id === "nexus" ? "三向档案节点" : undefined
            }
            aria-describedby={
              chapter.id === "nexus" ? "nexus-spatial-instructions" : undefined
            }
            onPointerDown={handleDirectionalPointerDown}
            onPointerMove={handleNexusPointerMove}
            onPointerUp={handleDirectionalPointerUp}
            onPointerLeave={() =>
              resetNexusSensing(nexusHoverArmedRef.current)
            }
            onPointerCancel={() => {
              dragStartRef.current = null;
              resetNexusSensing(nexusHoverArmedRef.current);
            }}
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
                <div className="nexus-navigation">
                  <div className="nexus-navigation-heading">
                    <span>SPATIAL ARCHIVE / POINTER FIELD ACTIVE</span>
                    <p>让鼠标靠近画面边缘，遗迹会感应你的方向。</p>
                  </div>

                  <p
                    className="nexus-a11y-instructions"
                    id="nexus-spatial-instructions"
                  >
                    鼠标移至画面左侧或右侧并短暂停留即可进入对应分支；也可使用左右方向键。向下滚动继续主线。
                  </p>

                  <div
                    className={`nexus-spatial-field${
                      currentChapter.id === "nexus" &&
                      !gateOpen &&
                      !indexOpen &&
                      !activeBranch
                        ? " is-active"
                        : ""
                    }${nexusPreview ? ` is-preview-${nexusPreview}` : ""}${
                      nexusDwell ? ` is-dwelling-${nexusDwell}` : ""
                    }`}
                    aria-hidden="true"
                  >
                    <div className="nexus-spatial-label nexus-spatial-label-memory">
                      <span>W / MEM-03 · PARTIAL</span>
                      <strong>
                        <i>←</i> 人类记忆库
                      </strong>
                      <small>水下仍有影像回应 · 移向左侧并停留</small>
                      <b className="nexus-dwell-line"><i /></b>
                    </div>

                    <div className="nexus-sensor-core">
                      <span>W</span>
                      <i />
                      <b>NEXUS / 03</b>
                      <i />
                      <span>E</span>
                    </div>

                    <div className="nexus-spatial-label nexus-spatial-label-idea">
                      <span>THO-02 · UNSTABLE / E</span>
                      <strong>
                        迁徙思想 <i>→</i>
                      </strong>
                      <small>风正在带走未完成的构思 · 移向右侧并停留</small>
                      <b className="nexus-dwell-line"><i /></b>
                    </div>

                    <div className="nexus-forward-cue">
                      <span>SCROLL / MAINLINE</span>
                      <strong>继续深入遗物锻造场</strong>
                      <i>↓</i>
                    </div>
                  </div>

                  <div
                    className="nexus-access-controls"
                    role="group"
                    aria-label="中央遗迹键盘导航"
                  >
                    <button
                      type="button"
                      onClick={() => openBranch("memory", true)}
                    >
                      ← 人类记忆库
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToChapter(index + 1)}
                    >
                      ↓ 遗物锻造场
                    </button>
                    <button
                      type="button"
                      onClick={() => openBranch("idea", true)}
                    >
                      迁徙思想 →
                    </button>
                  </div>

                  <p className="direction-hint">
                    <span className="direction-hint-desktop">
                      移至画面边缘并短暂停留 · 左右键或横向触控板亦可
                    </span>
                    <span className="direction-hint-mobile">
                      ← 左右滑动探索分支 · 向下继续主线 →
                    </span>
                  </p>
                  <div className="sealed-trace">
                    <span className="dual-ring" aria-hidden="true">
                      <i />
                      <i />
                    </span>
                    EMOTIONAL ARCHIVE / SEALED
                  </div>
                  <button
                    className="nexus-back"
                    type="button"
                    onClick={() => scrollToChapter(index - 1)}
                  >
                    ↑ 返回通讯中继站
                  </button>
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

              {chapter.id !== "nexus" && <div className="chapter-actions">
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
              </div>}
            </div>
          </section>
        ))}
      </div>

      {currentBranch && (
        <aside
          className={`branch-explorer branch-${currentBranch.id}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`branch-title-${currentBranch.id}`}
        >
          <div className="branch-scene" aria-hidden="true">
            <div className="branch-scene-image" />
            <div className="branch-scene-grade" />
            <div className="branch-sensory">
              {Array.from({ length: 10 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <div className="branch-scene-noise" />
          </div>

          <button
            className="branch-return"
            type="button"
            onClick={closeBranch}
          >
            <span aria-hidden="true">
              {currentBranch.direction === "left" ? "→" : "←"}
            </span>
            返回中央遗迹 <small>ESC</small>
          </button>

          <div className="branch-copy">
            <div className="branch-meta">
              <span>{currentBranch.code}</span>
              <span>{currentBranch.systemLabel}</span>
            </div>
            <h2
              id={`branch-title-${currentBranch.id}`}
              ref={branchHeadingRef}
              tabIndex={-1}
            >
              <span>{currentBranch.titleEn}</span>
              {currentBranch.titleZh}
            </h2>
            <p>{currentBranch.description}</p>
            <blockquote>{currentBranch.quote}</blockquote>

            <div className="branch-records" aria-label="已探测档案状态">
              {currentBranch.records.map((record, index) => (
                <span key={record}>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  {record}
                </span>
              ))}
            </div>

            <div className="branch-actions">
              <button
                className="primary-action"
                type="button"
                onClick={openArchiveIndex}
              >
                <span>OPEN PUBLIC RECORD</span>
                在档案索引中查看
                <i aria-hidden="true">↗</i>
              </button>
              <button className="text-action" type="button" onClick={closeBranch}>
                回到三向节点
              </button>
            </div>
          </div>

          <div className="branch-axis" aria-hidden="true">
            <span className={currentBranch.id === "memory" ? "is-active" : ""}>
              MEMORY
            </span>
            <i />
            <span>HUB</span>
            <i />
            <span className={currentBranch.id === "idea" ? "is-active" : ""}>
              IDEA
            </span>
          </div>
        </aside>
      )}

      <div className="chapter-announcer" aria-live="polite" aria-atomic="true">
        当前节点：{currentChapter.titleZh}
        {currentBranch ? `，${currentBranch.titleZh}分支` : ""}
      </div>

      {gateOpen && (
        <div
          className="entry-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="entry-title"
        >
          <div className="gate-backdrop" />
          <div className="gate-grid">
            <div className="gate-copy">
              <p className="gate-kicker">A PERSONAL ARCHIVE AFTER HUMANITY</p>
              <h1 id="entry-title">
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
                <span>完整主线约90秒 · 可随时跳过</span>
              </div>
            </div>

            <div className="gate-sigil">
              <EchoSeal />
              <span>ARCHIVE / M-01</span>
            </div>

            <div className="gate-route" aria-hidden="true">
              <span>ENTRY VECTOR / RECOVERED</span>
              <ol>
                <li><i />荒原巨构</li>
                <li><i />通讯中继</li>
                <li><i />中央遗迹</li>
              </ol>
              <p>MAINLINE ↓ · BRANCH ← →</p>
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
              {publicArchiveNodes.map((node) => (
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
              ))}
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
