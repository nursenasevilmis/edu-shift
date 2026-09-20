// In-house icon set — no lucide-react, no external icon package.
// Square line caps + one consistent stroke weight, drawn to feel like part of
// the EduShift system rather than a generic icon pack. Same call signature as
// lucide (size, strokeWidth, className, color, ...rest) so every existing
// <Icon size={16} className="..." /> call site keeps working unchanged.

function Base({ size = 16, strokeWidth = 1.75, className = '', color, children, viewBox = '0 0 24 24', ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const ChevronDown = (p) => <Base {...p}><path d="M5 8.5 12 15l7-6.5" /></Base>
export const ChevronRight = (p) => <Base {...p}><path d="M8.5 5 15 12l-6.5 7" /></Base>
export const ArrowUpRight = (p) => <Base {...p}><path d="M6 18 18 6M8 6h10v10" /></Base>
export const ArrowRight = (p) => <Base {...p}><path d="M4 12h16M13 5l7 7-7 7" /></Base>

export const Check = (p) => <Base {...p}><path d="M4 12.5 9.5 18 20 6" /></Base>
export const CheckCircle2 = (p) => <Base {...p}><circle cx="12" cy="12" r="8.5" /><path d="M8 12.3 11 15.3 16 9" /></Base>
export const XCircle = (p) => <Base {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9 9l6 6M15 9l-6 6" /></Base>
export const X = (p) => <Base {...p}><path d="M5 5l14 14M19 5 5 19" /></Base>

export const AlertTriangle = (p) => <Base {...p}><path d="M12 4 21.5 20H2.5L12 4Z" /><path d="M12 10v4.2" /><circle cx="12" cy="17.6" r="0.4" fill="currentColor" stroke="none" /></Base>
export const Info = (p) => <Base {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5" /><circle cx="12" cy="8" r="0.4" fill="currentColor" stroke="none" /></Base>
export const CircleHelp = (p) => <Base {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.3c.2-1.3 1.2-2.1 2.5-2.1 1.4 0 2.5.9 2.5 2.1 0 1.6-2.5 1.7-2.5 3.6" /><circle cx="12" cy="17" r="0.4" fill="currentColor" stroke="none" /></Base>

export const ShieldCheck = (p) => <Base {...p}><path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z" /><path d="M8.7 12 11 14.3l4.3-4.6" /></Base>
export const LockKeyhole = (p) => <Base {...p}><rect x="5.5" y="10.5" width="13" height="9.5" rx="1.5" /><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" /><circle cx="12" cy="14.8" r="1.2" /><path d="M12 16v2" /></Base>

export const Plus = (p) => <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
export const Pencil = (p) => <Base {...p}><path d="M15.5 4.5 19.5 8.5 8 20H4v-4L15.5 4.5Z" /></Base>
export const Trash2 = (p) => <Base {...p}><path d="M4.5 7h15M9.5 7V4.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8V7M18 7l-.7 12a1.5 1.5 0 0 1-1.5 1.4H8.2A1.5 1.5 0 0 1 6.7 19L6 7" /><path d="M10 11v6M14 11v6" /></Base>
export const Download = (p) => <Base {...p}><path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" /><path d="M4.5 17.5V19c0 .8.7 1.5 1.5 1.5h12c.8 0 1.5-.7 1.5-1.5v-1.5" /></Base>

export const Users = (p) => <Base {...p}><circle cx="9" cy="8.3" r="3.3" /><path d="M2.8 19c.6-3 2.9-5 6.2-5s5.6 2 6.2 5" /><path d="M15.7 5.3a3.3 3.3 0 0 1 0 6" /><path d="M16.2 14c2.6.4 4.4 2.1 5 4.9" /></Base>
export const UserCheck = (p) => <Base {...p}><circle cx="9.5" cy="8.3" r="3.3" /><path d="M3 19c.6-3 2.9-5 6.5-5 1.5 0 2.8.4 3.9 1.1" /><path d="M15.5 13.5l2.2 2.2 3.3-3.7" /></Base>
export const BookOpen = (p) => <Base {...p}><path d="M12 6.3C10.5 5 8.3 4.3 5.5 4.3v13.4c2.8 0 5 .7 6.5 2 1.5-1.3 3.7-2 6.5-2V4.3c-2.8 0-5 .7-6.5 2Z" /><path d="M12 6.3v13.4" /></Base>
export const Book = (p) => <Base {...p}><path d="M5.5 4.5h11a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-11A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 4.5Z" /><path d="M7.5 4.5V19" /></Base>
export const BookMarked = (p) => <Base {...p}><path d="M6 3.5h9.5A2.5 2.5 0 0 1 18 6v15l-4.5-3-4.5 3V6a2.5 2.5 0 0 1 2.5-2.5H6Z" /><path d="M6 3.5A2.5 2.5 0 0 0 3.5 6v13" /></Base>
export const Layers = (p) => <Base {...p}><path d="M12 3.5 21 8.5 12 13.5 3 8.5 12 3.5Z" /><path d="M3 13.5 12 18.5 21 13.5" /></Base>
export const Gauge = (p) => <Base {...p}><circle cx="12" cy="13" r="8" /><path d="M12 13 15.8 9" /><path d="M8.5 7 7 5.3M15.5 7 17 5.3M6 13H4M20 13h-2" /></Base>
export const Clock = (p) => <Base {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.3V12l3.3 2" /></Base>
export const Circle = (p) => <Base {...p}><circle cx="12" cy="12" r="7" /></Base>

export const CalendarClock = (p) => <Base {...p}><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" /><circle cx="15" cy="15" r="3.6" /><path d="M15 13.2V15l1.3.9" /></Base>
export const CalendarDays = (p) => <Base {...p}><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" /><path d="M7.5 13.2h1.2M11.4 13.2h1.2M15.3 13.2h1.2M7.5 16.6h1.2M11.4 16.6h1.2" /></Base>
export const CalendarX = (p) => <Base {...p}><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" /><path d="M9.5 13.5l5 5M14.5 13.5l-5 5" /></Base>
export const ClipboardList = (p) => <Base {...p}><rect x="5" y="4.5" width="14" height="16.5" rx="1.5" /><rect x="9" y="3" width="6" height="3" rx="1" /><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5" /></Base>
export const SlidersHorizontal = (p) => <Base {...p}><path d="M4 7h6M14 7h6M4 17h10M18 17h2" /><circle cx="12" cy="7" r="2.1" /><circle cx="16" cy="17" r="2.1" /></Base>
export const LayoutGrid = (p) => <Base {...p}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></Base>
export const Menu = (p) => <Base {...p}><path d="M4 6.5h16M4 12h16M4 17.5h16" /></Base>
export const LogOut = (p) => <Base {...p}><path d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3" /><path d="M13.5 8.5 17.5 12l-4 3.5" /><path d="M17.2 12H9.5" /></Base>
export const Wand2 = (p) => <Base {...p}><path d="M4 20 15 9" /><path d="M13.5 4.5v2.6M13.5 10.9v2.6M17.6 6.7h2.6M8.6 6.7H11" /></Base>
export const Search = (p) => <Base {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.5-4.5" /></Base>
