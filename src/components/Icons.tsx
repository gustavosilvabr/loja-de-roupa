interface IconProps {
  className?: string;
}

const base = 'h-5 w-5';

export const SearchIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
  </svg>
);

export const UserIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" strokeLinecap="round" />
  </svg>
);

export const CartIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 7h13l-1.4 9.3a2 2 0 0 1-2 1.7H9.4a2 2 0 0 1-2-1.7L6 7Z" strokeLinejoin="round" />
    <path d="M6 7 5 3H3" strokeLinecap="round" />
    <circle cx="9.5" cy="21" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="21" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const ChevronLeft = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronRight = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronDown = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
  </svg>
);

export const MenuIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
  </svg>
);

export const ClockIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PixIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.6 8.4 6.2h1.2c.6 0 1.2.2 1.6.7L14 9.7c.5.5.5 1.3 0 1.8l-2.8 2.8c-.4.4-1 .7-1.6.7H8.4L12 18.6l3.6-3.6h-1.2c-.6 0-1.2-.3-1.6-.7L10 11.5c-.5-.5-.5-1.3 0-1.8l2.8-2.8c.4-.5 1-.7 1.6-.7h1.2L12 2.6ZM5.5 8.1 2.7 10.9c-.6.6-.6 1.6 0 2.2l2.8 2.8h1.6c.4 0 .8-.2 1.1-.5l2.8-2.8c.2-.2.2-.6 0-.8L8.2 8.6c-.3-.3-.7-.5-1.1-.5H5.5Zm13 0h-1.6c-.4 0-.8.2-1.1.5L13 11.4c-.2.2-.2.6 0 .8l2.8 2.8c.3.3.7.5 1.1.5h1.6l2.8-2.8c.6-.6.6-1.6 0-2.2L18.5 8.1Z" />
  </svg>
);

export const ShieldIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 3 5 6v6c0 4.4 3 8.2 7 9 4-.8 7-4.6 7-9V6l-7-3Z" strokeLinejoin="round" />
    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TruckIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z" strokeLinejoin="round" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </svg>
);

export const InstagramIcon = ({ className = base }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
