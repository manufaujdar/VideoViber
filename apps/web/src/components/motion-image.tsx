'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import Image, { type ImageProps } from 'next/image';

type MotionPreset = 'drift' | 'float' | 'pan' | 'pulse';
type MotionSpeed = 'slow' | 'medium' | 'fast';

type MotionImageProps = Omit<ImageProps, 'alt'> & {
  alt: string;
  motionPreset?: MotionPreset;
  motionSpeed?: MotionSpeed;
  motionDelayMs?: number;
  pauseWhenOffscreen?: boolean;
};

export function MotionImage({
  alt,
  className,
  style,
  motionPreset = 'drift',
  motionSpeed = 'medium',
  motionDelayMs = 0,
  pauseWhenOffscreen = true,
  priority,
  loading,
  fetchPriority,
  quality,
  ...imageProps
}: MotionImageProps) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const [inView, setInView] = useState(!pauseWhenOffscreen);

  useEffect(() => {
    if (!pauseWhenOffscreen) {
      return;
    }

    const target = wrapperRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setInView(entry.isIntersecting);
      },
      { root: null, rootMargin: '220px 0px', threshold: 0.05 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [pauseWhenOffscreen]);

  return (
    <span ref={wrapperRef} className="contents">
      <Image
        alt={alt}
        priority={priority}
        loading={priority ? undefined : (loading ?? 'lazy')}
        fetchPriority={priority ? fetchPriority : (fetchPriority ?? 'low')}
        decoding={imageProps.decoding ?? 'async'}
        quality={quality ?? 72}
        {...imageProps}
        className={clsx(
          className,
          'vv-motion-image',
          `vv-motion-${motionPreset}`,
          `vv-motion-${motionSpeed}`,
          pauseWhenOffscreen && !inView && 'vv-motion-paused'
        )}
        style={
          {
            ...style,
            '--vv-motion-delay': `${motionDelayMs}ms`,
          } as CSSProperties
        }
      />
    </span>
  );
}
