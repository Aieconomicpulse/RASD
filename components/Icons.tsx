import type { SVGProps } from 'react';

export type IconName =
  | 'room' | 'monitoring' | 'alerts' | 'portals' | 'brief'
  | 'gdp' | 'inflation' | 'spending' | 'sentiment'
  | 'foodwatch' | 'macro' | 'shipping' | 'stocks' | 'jamarik'
  | 'external' | 'desk';

/** One stroke family for the whole room: 24-unit grid, 1.8 stroke, round joins. No fills except the dot on the pulse. */
const PATHS: Record<IconName, React.ReactNode> = {
  room: <><rect x="3" y="4" width="8" height="6" rx="1" /><rect x="13" y="4" width="8" height="6" rx="1" /><rect x="3" y="12" width="8" height="6" rx="1" /><rect x="13" y="12" width="8" height="6" rx="1" /><path d="M8 21h8" /></>,
  monitoring: <><path d="M3 12h4l2.5-6 4 12 2.5-6H21" /></>,
  alerts: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  portals: <><path d="M13 4h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6" /><path d="M4 12h11" /><path d="M11 8l4 4-4 4" /></>,
  brief: <><path d="M7 3h7l4 4v14H7Z" /><path d="M14 3v4h4" /><path d="M10 12h6M10 16h6" /></>,
  gdp: <><path d="M4 20V13M10 20V8M16 20V11M22 20V5" /></>,
  inflation: <><path d="M4 12l8-8h7v7l-8 8Z" /><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" /></>,
  spending: <><path d="M3 5h2l2.2 11h11.3L21 8H6" /><circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" /><circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" /></>,
  sentiment: <><path d="M4 5h16v11h-9l-4 3v-3H4Z" /><path d="M8 11h.5M12 11h.5M16 11h.5" strokeWidth="2.4" /></>,
  foodwatch: <><path d="M12 21V9" /><path d="M12 9c0-3 2-5 5-5-0 3-2 5-5 5Z" /><path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5Z" /><path d="M12 17c0-3 2-5 5-5 0 3-2 5-5 5Z" /></>,
  macro: <><path d="M3 12h4l2.5-6 4 12 2.5-6H21" /><circle cx="21" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  shipping: <><path d="M3 16l1.5 3h15L21 16" /><path d="M5 16V9h14v7" /><path d="M9 9V5h6v4" /><path d="M2 16h20" /></>,
  stocks: <><path d="M6 4v4M6 14v6M6 8h-2v6h4V8ZM12 3v3M12 13v8M12 6h-2v7h4V6ZM18 7v3M18 17v3M18 10h-2v7h4v-7Z" /></>,
  jamarik: <><path d="M12 3v18" /><path d="M5 7h14" /><path d="M5 7l-3 7a3 3 0 0 0 6 0Z" /><path d="M19 7l-3 7a3 3 0 0 0 6 0Z" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></>,
  desk: <><path d="M4 7h16v10H4Z" /><path d="M4 12h16" /><path d="M9 20l1-3M15 20l-1-3" /></>,
};

export default function Icon({ name, size = 22, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {PATHS[name]}
    </svg>
  );
}
