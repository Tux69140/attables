import React from 'react';
import { FoyerPictoId } from '../types/models';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Phosphor Duotone style icons for Foyer 44px tiles & meal categories
 * Always rendered with ink #1A263C inside Foyer tiles.
 */
export const FoyerPictoIcon: React.FC<{ picto: FoyerPictoId; size?: number; className?: string }> = ({
  picto,
  size = 24,
  className = '',
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 256 256',
    fill: 'none',
    className,
    'aria-hidden': true as const,
  };

  switch (picto) {
    case 'maison':
      return (
        <svg {...common}>
          <path
            d="M152 208V160a8 8 0 0 0-8-8H112a8 8 0 0 0-8 8v48H48a8 8 0 0 1-8-8V115.54a8 8 0 0 1 2.62-5.92l80-75.54a8 8 0 0 1 10.76 0l80 75.54a8 8 0 0 1 2.62 5.92V200a8 8 0 0 1-8 8Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M213.38 109.62l-80-75.54a8 8 0 0 0-10.76 0l-80 75.54A8 8 0 0 0 40 115.54V200a8 8 0 0 0 8 8h56v-48a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v48h56a8 8 0 0 0 8-8V115.54a8 8 0 0 0-2.62-5.92Z"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'table':
      return (
        <svg {...common}>
          <path
            d="M84 40v176M172 40v176"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <rect
            x="40"
            y="88"
            width="176"
            height="48"
            rx="10"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M32 96h192M56 96v96M200 96v96M80 144h96"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'coeur':
      return (
        <svg {...common}>
          <path
            d="M128 216S28 160 28 92A52 52 0 0 1 128 72a52 52 0 0 1 100 20c0 68-100 124-100 124Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M128 216S28 160 28 92A52 52 0 0 1 128 72a52 52 0 0 1 100 20c0 68-100 124-100 124Z"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'marmite':
      return (
        <svg {...common}>
          <path
            d="M48 96h160v80a32 32 0 0 1-32 32H80a32 32 0 0 1-32-32V96Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M48 96h160v80a32 32 0 0 1-32 32H80a32 32 0 0 1-32-32V96ZM24 96h208M104 56h48M128 36v20"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'verre':
      return (
        <svg {...common}>
          <path
            d="M72 40h112l-12 72a44 44 0 0 1-88 0Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M72 40h112l-12 72a44 44 0 0 1-88 0ZM128 156v60M88 216h80"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'feuille':
      return (
        <svg {...common}>
          <path
            d="M64 192C40 120 88 48 208 40c-8 120-80 168-144 152Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M64 192C40 120 88 48 208 40c-8 120-80 168-144 152ZM40 216l104-104"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'soleil':
      return (
        <svg {...common}>
          <circle cx="128" cy="128" r="56" fill="currentColor" opacity="0.22" />
          <circle cx="128" cy="128" r="56" stroke="currentColor" strokeWidth="18" />
          <path
            d="M128 24v20M128 212v20M24 128h20M212 128h20M54 54l14 14M188 188l14 14M202 54l-14 14M68 188l-14 14"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'etoile':
      return (
        <svg {...common}>
          <path
            d="M128 28l28 60 66 8-49 46 13 65-58-32-58 32 13-65-49-46 66-8Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M128 28l28 60 66 8-49 46 13 65-58-32-58 32 13-65-49-46 66-8Z"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

/**
 * Phosphor Bold style UI icons
 */
export const IconCalendar: React.FC<IconProps & { active?: boolean }> = ({
  size = 22,
  className = '',
  active = false,
}) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    {active && <rect x="36" y="88" width="184" height="124" rx="8" fill="currentColor" opacity="0.2" />}
    <rect x="36" y="44" width="184" height="168" rx="16" stroke="currentColor" strokeWidth="22" />
    <path d="M176 24v36M80 24v36M36 92h184" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
    <circle cx="92" cy="140" r="12" fill="currentColor" />
    <circle cx="128" cy="140" r="12" fill="currentColor" />
    <circle cx="164" cy="140" r="12" fill="currentColor" />
  </svg>
);

export const IconUsers: React.FC<IconProps & { active?: boolean }> = ({
  size = 22,
  className = '',
  active = false,
}) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    {active && <circle cx="96" cy="108" r="44" fill="currentColor" opacity="0.2" />}
    <circle cx="96" cy="108" r="44" stroke="currentColor" strokeWidth="22" />
    <path
      d="M24 212c14-32 42-48 72-48s58 16 72 48M164 68a40 40 0 1 1 0 76M180 166c26 4 44 20 52 46"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
    />
  </svg>
);

export const IconGear: React.FC<IconProps> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <circle cx="128" cy="128" r="36" stroke="currentColor" strokeWidth="20" />
    <path
      d="M107 28h42l6 33 17 10 32-11 21 36-26 22v20l26 22-21 36-32-11-17 10-6 33h-42l-6-33-17-10-32 11-21-36 26-22v-20L31 96l21-36 32 11 17-10 6-33Z"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path d="M40 128h176M128 40v176" stroke="currentColor" strokeWidth="24" strokeLinecap="round" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <circle cx="112" cy="112" r="76" stroke="currentColor" strokeWidth="22" />
    <path d="M166 166l54 54" stroke="currentColor" strokeWidth="24" strokeLinecap="round" />
  </svg>
);

export const IconHome: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M214 112L134 38a9 9 0 0 0-12 0L42 112a8 8 0 0 0-2 6v90a8 8 0 0 0 8 8h56v-56h48v56h56a8 8 0 0 0 8-8v-90a8 8 0 0 0-2-6Z"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconAlert: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M114.15 36.06L26.2 188a16 16 0 0 0 13.85 24h175.9a16 16 0 0 0 13.85-24L141.85 36.06a16 16 0 0 0-27.7 0Z"
      fill="currentColor"
      opacity="0.16"
    />
    <path
      d="M114.15 36.06L26.2 188a16 16 0 0 0 13.85 24h175.9a16 16 0 0 0 13.85-24L141.85 36.06a16 16 0 0 0-27.7 0Z"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinejoin="round"
    />
    <path d="M128 100v48" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
    <circle cx="128" cy="176" r="12" fill="currentColor" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M44 136l56 56L212 72"
      stroke="currentColor"
      strokeWidth="24"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconArrowLeft: React.FC<IconProps> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M216 128H48M116 60l-68 68 68 68"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path d="M96 48l80 80-80 80" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path d="M200 56L56 200M200 200L56 56" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
  </svg>
);

export const IconTrash: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M216 56H40M88 24h80M200 56v152a16 16 0 0 1-16 16H72a16 16 0 0 1-16-16V56M104 104v64M152 104v64"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconEdit: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M92.69 216H48a8 8 0 0 1-8-8v-44.69a8 8 0 0 1 2.34-5.65L165.66 34.34a8 8 0 0 1 11.31 0L221.66 79a8 8 0 0 1 0 11.31L98.34 213.66a8 8 0 0 1-5.65 2.34Z"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M136 64l56 56" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
  </svg>
);

export const IconCopy: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <rect x="40" y="88" width="128" height="128" rx="12" stroke="currentColor" strokeWidth="20" />
    <path
      d="M88 88V52a12 12 0 0 1 12-12h104a12 12 0 0 1 12 12v104a12 12 0 0 1-12 12h-36"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinecap="round"
    />
  </svg>
);

export const IconShare: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <circle cx="64" cy="128" r="28" stroke="currentColor" strokeWidth="20" />
    <circle cx="184" cy="64" r="28" stroke="currentColor" strokeWidth="20" />
    <circle cx="184" cy="192" r="28" stroke="currentColor" strokeWidth="20" />
    <path d="M89 115l70-38M89 141l70 38" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
  </svg>
);

export const IconUndo: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M80 136L32 88l48-48"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M32 88h128a56 56 0 0 1 0 112H88"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconDownload: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M128 36v116M80 108l48 48 48-48M40 168v36a12 12 0 0 0 12 12h152a12 12 0 0 0 12-12v-36"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconUpload: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M128 152V36M80 80l48-48 48 48M40 168v36a12 12 0 0 0 12 12h152a12 12 0 0 0 12-12v-36"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconUtensils: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M84 32v192M52 32v48a32 32 0 0 0 64 0V32M196 156H152s0-92 44-124v192"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconPromptExport: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <rect x="40" y="40" width="176" height="176" rx="18" fill="currentColor" opacity="0.16" />
    <rect x="40" y="40" width="176" height="176" rx="18" stroke="currentColor" strokeWidth="20" />
    <path
      d="M84 96h88M84 132h88M84 168h52"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinecap="round"
    />
  </svg>
);

export const IconHeart: React.FC<IconProps & { filled?: boolean }> = ({
  size = 17,
  className = '',
  filled = false,
}) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M128 216S28 160 28 92A52 52 0 0 1 128 72a52 52 0 0 1 100 20c0 68-100 124-100 124Z"
      fill={filled ? 'currentColor' : 'none'}
      opacity={filled ? 0.25 : 1}
    />
    <path
      d="M128 216S28 160 28 92A52 52 0 0 1 128 72a52 52 0 0 1 100 20c0 68-100 124-100 124Z"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconThumbUp: React.FC<IconProps> = ({ size = 17, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M32 104h48v104H32a8 8 0 0 1-8-8v-88a8 8 0 0 1 8-8ZM80 104l40-72a24 24 0 0 1 24 24v48h56a16 16 0 0 1 15.8 18.6l-12 72A16 16 0 0 1 188 208H80"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconBan: React.FC<IconProps> = ({ size = 17, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="22" />
    <path d="M60 60l136 136" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="22" />
    <path d="M128 72v56l44 26" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconShield: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M40 56h176v56c0 84-88 112-88 112s-88-28-88-112V56Z"
      fill="currentColor"
      opacity="0.16"
    />
    <path
      d="M40 56a8 8 0 0 1 8-8h160a8 8 0 0 1 8 8v56c0 84-88 112-88 112s-88-28-88-112V56Z"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinejoin="round"
    />
    <path d="M92 132l24 24 48-48" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path d="M48 96l80 80 80-80" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconRepeat: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
    <path
      d="M200 88l24-24-24-24M56 168l-24 24 24 24"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M224 64H88a56 56 0 0 0-56 56v8M32 192h136a56 56 0 0 0 56-56v-8"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


