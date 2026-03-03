'use client';

import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  className?: string;
  wordmarkClassName?: string;
  compact?: boolean;
};

export function BrandLogo({
  href = '/',
  className = '',
  wordmarkClassName = '',
  compact = false,
}: BrandLogoProps) {
  const content = (
    <>
      <span className="vv-brand-mark" aria-hidden="true">
        <svg className="vv-brand-glyph" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      {!compact && (
        <span className={`vv-brand-word ${wordmarkClassName}`.trim()}>
          VideoViber
        </span>
      )}
    </>
  );

  if (!href) {
    return <span className={`vv-brand-logo ${className}`.trim()}>{content}</span>;
  }

  return (
    <Link href={href} className={`vv-brand-logo ${className}`.trim()}>
      {content}
    </Link>
  );
}
