import { ReactNode } from "react";

const P: Record<string, ReactNode> = {
  bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></>,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.500-7 10-7 10z" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 8h16M4 16h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.500" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
  star: <path d="M12 4l2.400 5 5.600.8-4 3.900.9 5.500L12 16.500 7.100 19.200 8 13.700 4 9.800 9.600 9z" />,
  truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.500" r="1.500" /><circle cx="17" cy="17.500" r="1.500" /></>,
  return: <path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10" />,
  fleece: <path d="M4 9c2-2 3 2 5 0s3 2 5 0 3 2 6 0M4 14c2-2 3 2 5 0s3 2 5 0 3 2 6 0M4 19c2-2 3 2 5 0s3 2 5 0 3 2 6 0" />,
  cotton: <><circle cx="9" cy="9" r="3" /><circle cx="15" cy="9" r="3" /><circle cx="12" cy="14" r="3" /><path d="M12 17v4" /></>,
  terry: <><circle cx="7" cy="8" r="2" /><circle cx="12" cy="8" r="2" /><circle cx="17" cy="8" r="2" /><circle cx="7" cy="14" r="2" /><circle cx="12" cy="14" r="2" /><circle cx="17" cy="14" r="2" /></>,
  sherpa: <path d="M5 16a3 3 0 013-5 3.500 3.500 0 016 -1 3.500 3.500 0 015 3 3 3 0 01-2 4H7a3 3 0 01-2-1z" />,
  needle: <><path d="M5 19L19 5" /><ellipse cx="18" cy="6" rx="1" ry="2" transform="rotate(45 18 6)" /><path d="M5 19c3-1 5 1 8-2" strokeDasharray="1 2" /></>,
  leaf: <><path d="M5 19C5 10 11 5 20 5c0 9-5 15-14 14z" /><path d="M5 19l8-8" /></>,
  ruler: <><rect x="3" y="9" width="18" height="6" /><path d="M7 9v3M11 9v2M15 9v3M19 9v2" /></>,
  box: <><path d="M4 8l8-4 8 4v9l-8 4-8-4z" /><path d="M4 8l8 4 8-4M12 12v9" /></>,
  whatsapp: <><path d="M4 20l1.500-4.500A8 8 0 118 19z" /><path d="M9 9c0 3 3 6 6 6l1-2-2-1-1 .8c-1-.5-2-1.500-2.500-2.500L11 9l-1-2z" /></>,
  pin: <><path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.500" /></>,
  user: <><circle cx="12" cy="8" r="3.500" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /></>,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.500" /><circle cx="17" cy="7" r=".5" /></>,
  facebook: <path d="M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />,
  mail: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 8l9 6 9-6" /></>,
  rotate: <path d="M4 12a8 8 0 0114-5M20 4v4h-4M20 12a8 8 0 01-14 5M4 20v-4h4" />,
};

export function Icon({ name, size = 20, className = "", sw = 1 }: { name: keyof typeof P | string; size?: number; className?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[name]}
    </svg>
  );
}

export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-[2px] text-accent" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(value) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2"><path d="M12 4l2.400 5 5.600.8-4 3.900.9 5.500L12 16.500 7.100 19.200 8 13.700 4 9.800 9.600 9z" /></svg>
      ))}
    </span>
  );
}
