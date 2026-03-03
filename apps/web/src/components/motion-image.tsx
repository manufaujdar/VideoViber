import type { CSSProperties } from 'react';
import clsx from 'clsx';
import Image, { type ImageProps } from 'next/image';

type MotionPreset = 'drift' | 'float' | 'pan' | 'pulse';
type MotionSpeed = 'slow' | 'medium' | 'fast';

type MotionImageProps = ImageProps & {
  motionPreset?: MotionPreset;
  motionSpeed?: MotionSpeed;
  motionDelayMs?: number;
};

export function MotionImage({
  alt,
  className,
  style,
  motionPreset = 'drift',
  motionSpeed = 'medium',
  motionDelayMs = 0,
  ...imageProps
}: MotionImageProps) {
  const motionStyle = {
    ...style,
    '--vv-motion-delay': `${motionDelayMs}ms`,
  } as CSSProperties;

  return (
    <Image
      alt={alt}
      {...imageProps}
      className={clsx(
        className,
        'vv-motion-image',
        `vv-motion-${motionPreset}`,
        `vv-motion-${motionSpeed}`
      )}
      style={motionStyle}
    />
  );
}
