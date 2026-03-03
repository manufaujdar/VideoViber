'use client';

import Link from 'next/link';
import type { CSSProperties, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { MotionImage } from '@/components/motion-image';
import styles from './cinematic-home.module.css';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VideoViber',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description:
    'AI-native video studio for building cinematic worlds with continuity memory, shot planning, and timeline direction.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

type ModePreset = {
  id: string;
  label: string;
  tone: string;
  description: string;
  previewImage: string;
  controls: { name: string; value: string; level: number }[];
};

const modePresets: ModePreset[] = [
  {
    id: 'mythic',
    label: 'Mythic Horizon',
    tone: 'Epic / Atmospheric',
    description:
      'Long-lens sweeps, volumetric haze, and reflective city geometry that feels like opening night in a mega-screen theater.',
    previewImage:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=80',
    controls: [
      { name: 'Lens Drift', value: 'Orbital', level: 72 },
      { name: 'Atmosphere', value: 'Volumetric Dusk', level: 84 },
      { name: 'Continuity Lock', value: 'Active', level: 92 },
    ],
  },
  {
    id: 'kinetic',
    label: 'Kinetic Neon',
    tone: 'Fast / Electric',
    description:
      'High-energy camera choreography tuned for rhythm edits, punchy transitions, and stylized speed ramps.',
    previewImage:
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
    controls: [
      { name: 'Lens Drift', value: 'Handheld Glide', level: 88 },
      { name: 'Atmosphere', value: 'Charged Rain', level: 76 },
      { name: 'Continuity Lock', value: 'Adaptive', level: 69 },
    ],
  },
  {
    id: 'dream',
    label: 'Dreamwave',
    tone: 'Surreal / Character',
    description:
      'Soft diffusion, emotional closeups, and impossible transitions designed for story-first visual poetry.',
    previewImage:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    controls: [
      { name: 'Lens Drift', value: 'Floating Dolly', level: 66 },
      { name: 'Atmosphere', value: 'Chromatic Mist', level: 93 },
      { name: 'Continuity Lock', value: 'Narrative Memory', level: 95 },
    ],
  },
];

const missionTracks = [
  {
    title: 'World Foundry',
    description:
      'Transform a one-line idea into a coherent world bible with lighting, texture, architecture, and weather language.',
    reward: '+240 Creative XP',
    difficulty: 'Elite',
    image:
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Character Continuity',
    description:
      'Lock identity, wardrobe evolution, and emotional arc across disconnected scenes and shot changes.',
    reward: '+170 Continuity XP',
    difficulty: 'Advanced',
    image:
      'https://images.unsplash.com/photo-1518085250887-2f903c200fee?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Timeline Raid',
    description:
      'Compose reveal beats, bridge transitions, and climax pacing without leaving the directing cockpit.',
    reward: '+210 Director XP',
    difficulty: 'Legendary',
    image:
      'https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1400&q=80',
  },
];

const showcaseShots = [
  {
    title: 'Eclipse Metropolis',
    meta: '8 sec • continuity active',
    image:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Signal Ocean',
    meta: '10 sec • atmosphere preset',
    image:
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Portrait of Tomorrow',
    meta: '6 sec • style memory locked',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80',
  },
];

const pipeline = [
  {
    step: '01',
    title: 'Draft Intent',
    text: 'Describe emotion, camera language, and narrative turn instead of writing brittle prompts.',
  },
  {
    step: '02',
    title: 'Spawn Missions',
    text: 'VideoViber converts the brief into mission cards with scene goals, continuity tags, and risk hints.',
  },
  {
    step: '03',
    title: 'Direct in Real Time',
    text: 'Steer shots, lock characters, and swap providers while the timeline remains intact.',
  },
  {
    step: '04',
    title: 'Ship the Cut',
    text: 'Export a cinematic first cut with story logic preserved from first frame to final beat.',
  },
];

export default function MarketingHomePage() {
  const portalRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastCommittedRatioRef = useRef(0.18);
  const lastCommitAtRef = useRef(0);
  const defaultMode = modePresets[0]!;
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

  const selectedMode = modePresets.find((mode) => mode.id === selectedModeId) ?? defaultMode;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <section className={styles.hero} id="top">
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.eyebrow}>AI-native cinematic operating system</p>
            <h1 className={styles.heroTitle}>
              Stop prompting clips.
              <span> Start directing universes.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              VideoViber now feels like a playable film studio: mission-driven flow, immersive 3D
              visuals, and a command deck that rewards creative direction over random trial and
              error.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/projects/new" className={styles.primaryButton}>
                Launch the Studio
              </Link>
              <Link href="#showcase" className={styles.ghostButton}>
                Watch Live Worlds
              </Link>
            </div>

            <div className={styles.kpiGrid}>
              <article className={styles.kpiCard}>
                <span>Mission Completion</span>
                <strong>{missionCompletion}%</strong>
                <small>auto-updates as you explore</small>
              </article>
              <article className={styles.kpiCard}>
                <span>Badges Unlocked</span>
                <strong>{unlockedBadges}/6</strong>
                <small>world builder progression</small>
              </article>
              <article className={styles.kpiCard}>
                <span>Live Scene</span>
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
                <p>Live Mission</p>
                <strong>World 07: Eclipse Bay</strong>
                <span>Continuity matrix synchronized</span>
              </article>

              <article className={`${styles.hudCard} ${styles.hudTopRight}`}>
                <p>Director XP</p>
                <strong>{missionCompletion * 13} pts</strong>
                <div className={styles.progressRail}>
                  <span style={{ width: `${missionCompletion}%` }} />
                </div>
              </article>

              <article className={`${styles.hudCard} ${styles.hudBottom}`}>
                <p>Active Objective</p>
                <strong>{activeShot.title}</strong>
                <span>{activeShot.meta}</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="studio">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>Gamified Creation Flow</p>
          <h2>Creative systems that feel like playable missions.</h2>
          <p>
            Each core capability is framed as a challenge track with progression feedback, making
            production feel energetic while preserving professional control.
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
          <p className={styles.sectionEyebrow}>Cinematic Gallery</p>
          <h2>Visual storytelling with depth, mood, and scale.</h2>
          <p>
            High-impact scene frames, atmospheric overlays, and responsive camera motion create a
            trailer-grade first impression across every viewport.
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
          <p className={styles.sectionEyebrow}>Production Questline</p>
          <h2>From spark to final cut, staged like a campaign run.</h2>
          <p>
            The workflow is now paced with checkpoint logic, objective clarity, and cinematic
            continuity from ideation through export.
          </p>
        </div>

        <div className={styles.pipelineGrid}>
          {pipeline.map((item) => (
            <article key={item.step} className={styles.pipelineCard}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="command">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>Command Deck</p>
          <h2>Switch cinematic modes and direct the output in real time.</h2>
          <p>
            Select a storytelling mode to immediately reconfigure camera behavior, atmosphere, and
            continuity response inside the viewport.
          </p>
        </div>

        <div className={styles.deckGrid}>
          <aside className={styles.modePanel}>
            {modePresets.map((mode) => (
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
          <p className={styles.sectionEyebrow}>Ready to Direct?</p>
          <h2>Turn your homepage visitors into world-builders in seconds.</h2>
          <p>
            This redesign adds cinematic depth, game-like momentum, and premium visual identity so
            the product feels like an experience before sign-up.
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
