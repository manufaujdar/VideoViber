'use client';

import Link from 'next/link';
import type { CSSProperties, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { MotionImage } from '@/components/motion-image';
import {
  homeJsonLd,
  marketingModePresets,
  marketingPipeline,
  missionTracks,
  showcaseShots,
} from '@/features/marketing';
import styles from './cinematic-home.module.css';

export default function MarketingHomePage() {
  const portalRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastCommittedRatioRef = useRef(0.18);
  const lastCommitAtRef = useRef(0);
  const defaultMode = marketingModePresets[0]!;
  const defaultShot = showcaseShots[0]!;

  const [scrollRatio, setScrollRatio] = useState(0.18);
  const [selectedModeId, setSelectedModeId] = useState(defaultMode.id);

  useEffect(() => {
    let frame: number | null = null;
    const minCommitIntervalMs = 120;

    const syncScroll = () => {
      if (frame !== null) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
        const ratio = Math.min(window.scrollY / maxScroll, 1);
        const roundedRatio = Math.round(ratio * 1000) / 1000;
        const now = performance.now();
        const timeSinceLastCommit = now - lastCommitAtRef.current;
        const diff = Math.abs(roundedRatio - lastCommittedRatioRef.current);

        if (timeSinceLastCommit >= minCommitIntervalMs || diff >= 0.04) {
          if (diff >= 0.005) {
            setScrollRatio(roundedRatio);
            lastCommittedRatioRef.current = roundedRatio;
          }
          lastCommitAtRef.current = now;
        }

        frame = null;
      });
    };

    syncScroll();
    window.addEventListener('scroll', syncScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', syncScroll);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    const portal = portalRef.current;
    if (!portal) return;
    portal.style.setProperty('--depth', `${Math.round(scrollRatio * 42)}px`);
  }, [scrollRatio]);

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  const selectedMode =
    marketingModePresets.find((mode) => mode.id === selectedModeId) ?? defaultMode;

  const missionCompletion = Math.min(100, 44 + Math.round(scrollRatio * 56));
  const unlockedBadges = Math.max(1, Math.min(6, Math.floor(scrollRatio * 7)));
  const activeShot =
    showcaseShots[Math.min(showcaseShots.length - 1, Math.floor(scrollRatio * 3))] ?? defaultShot;

  const handleScenePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (document.documentElement.classList.contains('vv-low-motion')) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    pendingPointerRef.current = { x, y };

    if (pointerFrameRef.current !== null) {
      return;
    }

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      const portal = portalRef.current;
      const pending = pendingPointerRef.current;
      if (!portal || !pending) {
        pointerFrameRef.current = null;
        return;
      }

      const rotateY = -10 + (pending.x - 0.5) * 16;
      const rotateX = 8 - (pending.y - 0.5) * 11;
      portal.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
      portal.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
      portal.style.setProperty('--mouse-x', `${Math.round(pending.x * 100)}%`);
      portal.style.setProperty('--mouse-y', `${Math.round(pending.y * 100)}%`);
      pointerFrameRef.current = null;
    });
  };

  const resetTilt = () => {
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }

    const portal = portalRef.current;
    if (!portal) return;
    portal.style.setProperty('--tilt-x', '8deg');
    portal.style.setProperty('--tilt-y', '-10deg');
    portal.style.setProperty('--mouse-x', '52%');
    portal.style.setProperty('--mouse-y', '46%');
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <section className={styles.hero} id="top">
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.eyebrow}>The new standard for AI production.</p>
            <h1 className={styles.heroTitle}>
              Pro tools.
              <span> Pure power.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              VideoViber is the ultimate cinematic workspace. Precision control, absolute continuity, and a timeline built for the modern director. Stop prompting clips. Start creating cinema.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/projects/new" className={styles.primaryButton}>
                Enter Studio
              </Link>
              <Link href="#showcase" className={styles.ghostButton}>
                Watch Pro Video
              </Link>
            </div>

            <div className={styles.kpiGrid}>
              <article className={styles.kpiCard}>
                <span>Continuity Lock</span>
                <strong>{missionCompletion}%</strong>
                <small>real-time synchronization</small>
              </article>
              <article className={styles.kpiCard}>
                <span>Render Speed</span>
                <strong>{unlockedBadges}x</strong>
                <small>timeline acceleration</small>
              </article>
              <article className={styles.kpiCard}>
                <span>Scene Depth</span>
                <strong>{activeShot.title}</strong>
                <small>{activeShot.meta}</small>
              </article>
            </div>
          </div>

          <div
            className={styles.sceneWrap}
            onPointerMove={handleScenePointerMove}
            onPointerLeave={resetTilt}
          >
            <div className={styles.portal} ref={portalRef}>
              <div className={styles.portalScreen}>
                <MotionImage
                  src={activeShot.image}
                  alt={`${activeShot.title} cinematic scene preview`}
                  fill
                  sizes="(max-width: 1100px) 100vw, 45vw"
                  className={styles.portalShot}
                  motionPreset="pan"
                  motionSpeed="slow"
                />
                <div className={styles.portalGlow} />
                <div className={styles.portalScan} />
                <div className={styles.portalBeam} />
                <div className={styles.portalRing} />
                <div className={styles.portalOrb} />
              </div>

              <article className={`${styles.hudCard} ${styles.hudTopLeft}`}>
                <p>Render Engine</p>
                <strong>World 07: Eclipse Bay</strong>
                <span>Continuity matrix perfectly synchronized</span>
              </article>

              <article className={`${styles.hudCard} ${styles.hudTopRight}`}>
                <p>System Load</p>
                <strong>{missionCompletion * 13} TF/s</strong>
                <div className={styles.progressRail}>
                  <span style={{ width: `${missionCompletion}%` }} />
                </div>
              </article>

              <article className={`${styles.hudCard} ${styles.hudBottom}`}>
                <p>Active Buffer</p>
                <strong>{activeShot.title}</strong>
                <span>{activeShot.meta}</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="studio">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>Pro Performance</p>
          <h2>Power that feels absolutely effortless.</h2>
          <p>
            Every core capability is engineered to remove friction, keeping you entirely focused on the cinematic outcome.
          </p>
        </div>

        <div className={styles.missionGrid}>
          {missionTracks.map((mission, index) => (
            <article
              key={mission.title}
              className={styles.missionCard}
              style={{ '--delay': `${index * 90}ms` } as CSSProperties}
            >
              <div className={styles.missionMediaWrap}>
                <MotionImage
                  src={mission.image}
                  alt={`${mission.title} cinematic visual`}
                  fill
                  sizes="(max-width: 1100px) 100vw, 33vw"
                  className={styles.missionMedia}
                  motionPreset="drift"
                  motionSpeed="medium"
                  motionDelayMs={index * 180}
                />
              </div>
              <div className={styles.missionBody}>
                <span>{mission.difficulty}</span>
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
                <div className={styles.missionFoot}>
                  <small>{mission.reward}</small>
                  <Link href="/features">Inspect</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="showcase">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>Stunning Output</p>
          <h2>Cinema-grade visuals.<br/>Instant uncompromising scale.</h2>
          <p>
            High-impact scene composition, pristine atmospheric lighting, and responsive camera motion guarantee a breathtaking final cut.
          </p>
        </div>

        <div className={styles.showcaseGrid}>
          {showcaseShots.map((shot, index) => (
            <article
              key={shot.title}
              className={styles.shotCard}
              style={{ '--shot-delay': `${index * 120}ms` } as CSSProperties}
            >
              <MotionImage
                src={shot.image}
                alt={`${shot.title} still frame`}
                fill
                sizes="(max-width: 1100px) 100vw, 33vw"
                className={styles.shotImage}
                motionPreset="float"
                motionSpeed="slow"
                motionDelayMs={index * 220}
              />
              <div className={styles.shotOverlay} />
              <div className={styles.shotMeta}>
                <strong>{shot.title}</strong>
                <span>{shot.meta}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="flow">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>Flawless Integration</p>
          <h2>From singular spark to finished master.</h2>
          <p>
            A workflow refined for velocity. Total objective clarity and absolute cinematic continuity from ideation directly to export.
          </p>
        </div>

        <div className={styles.pipelineGrid}>
          {marketingPipeline.map((item) => (
            <article key={item.step} className={styles.pipelineCard}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="command">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>Precision Interface</p>
          <h2>Ultimate control over every frame.</h2>
          <p>
            Instantly reconfigure camera behavior, manipulate atmosphere, and dictate continuity parameters right inside the viewport.
          </p>
        </div>

        <div className={styles.deckGrid}>
          <aside className={styles.modePanel}>
            {marketingModePresets.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedModeId(mode.id)}
                className={
                  mode.id === selectedMode.id
                    ? `${styles.modeButton} ${styles.modeButtonActive}`
                    : styles.modeButton
                }
              >
                <strong>{mode.label}</strong>
                <span>{mode.tone}</span>
              </button>
            ))}
          </aside>

          <article className={styles.viewportPanel}>
            <MotionImage
              src={selectedMode.previewImage}
              alt={`${selectedMode.label} cinematic mode preview`}
              fill
              sizes="(max-width: 1100px) 100vw, 45vw"
              className={styles.viewportImage}
              motionPreset="pan"
              motionSpeed="medium"
            />
            <div className={styles.viewportOverlay} />
            <div className={styles.viewportContent}>
              <h3>{selectedMode.label}</h3>
              <p>{selectedMode.description}</p>
            </div>
          </article>

          <article className={styles.controlPanel}>
            <h3>Live Control Matrix</h3>
            <p>{selectedMode.tone}</p>
            <ul>
              {selectedMode.controls.map((control) => (
                <li key={control.name}>
                  <div>
                    <span>{control.name}</span>
                    <strong>{control.value}</strong>
                  </div>
                  <div className={styles.controlRail}>
                    <span style={{ width: `${control.level}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.finale} id="finale">
        <div className={styles.finaleBox}>
          <p className={styles.sectionEyebrow}>Ready to begin?</p>
          <h2>Experience the future of production. Today.</h2>
          <p>
            Unprecedented depth, relentless velocity, and unmistakable visual identity. The ultimate studio upgrade is waiting.
          </p>
          <div className={styles.ctaRowCenter}>
            <Link href="/signup" className={styles.primaryButton}>
              Enter VideoViber
            </Link>
            <Link href="/pricing" className={styles.ghostButton}>
              Explore Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
