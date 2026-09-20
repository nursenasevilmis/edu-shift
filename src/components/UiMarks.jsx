const labels = {
  LayoutGrid: 'OV', CalendarClock: 'PL', Layers: 'ŞB', BookOpen: 'DR', Users: 'ÖĞ', CalendarX: 'KS',
  ClipboardList: 'AT', SlidersHorizontal: 'ZA', ShieldCheck: 'OK', BookMarked: 'ES', Menu: 'MN', X: '×',
  ChevronRight: '›', Sparkles: '!', LogOut: 'ÇK', CircleHelp: '?', ArrowUpRight: '↗', Wand2: 'OTO',
  CalendarDays: 'HF', Trash2: 'SİL', Info: 'i', ArrowRight: '→', CheckCircle2: 'OK', Circle: '•',
  AlertTriangle: '!', UserCheck: 'ÖĞ', Gauge: 'YÜK', LockKeyhole: 'KİL', Plus: '+', Pencil: 'DÜZ',
  Check: 'OK', Download: 'PDF', Clock: 'SA', Book: 'DR', XCircle: 'X', ChevronDown: '⌄',
}

export function UiMark({ name, className = '' }) {
  return <span aria-hidden="true" className={'ui-mark ' + className} data-mark={labels[name] || name}>{labels[name] || name}</span>
}

export const LayoutGrid = (props) => <UiMark name="LayoutGrid" {...props} />
export const CalendarClock = (props) => <UiMark name="CalendarClock" {...props} />
export const Layers = (props) => <UiMark name="Layers" {...props} />
export const BookOpen = (props) => <UiMark name="BookOpen" {...props} />
export const Users = (props) => <UiMark name="Users" {...props} />
export const CalendarX = (props) => <UiMark name="CalendarX" {...props} />
export const ClipboardList = (props) => <UiMark name="ClipboardList" {...props} />
export const SlidersHorizontal = (props) => <UiMark name="SlidersHorizontal" {...props} />
export const ShieldCheck = (props) => <UiMark name="ShieldCheck" {...props} />
export const BookMarked = (props) => <UiMark name="BookMarked" {...props} />
export const Menu = (props) => <UiMark name="Menu" {...props} />
export const X = (props) => <UiMark name="X" {...props} />
export const ChevronRight = (props) => <UiMark name="ChevronRight" {...props} />
export const Sparkles = (props) => <UiMark name="Sparkles" {...props} />
export const LogOut = (props) => <UiMark name="LogOut" {...props} />
export const CircleHelp = (props) => <UiMark name="CircleHelp" {...props} />
export const ArrowUpRight = (props) => <UiMark name="ArrowUpRight" {...props} />
export const Wand2 = (props) => <UiMark name="Wand2" {...props} />
export const CalendarDays = (props) => <UiMark name="CalendarDays" {...props} />
export const Trash2 = (props) => <UiMark name="Trash2" {...props} />
export const Info = (props) => <UiMark name="Info" {...props} />
export const ArrowRight = (props) => <UiMark name="ArrowRight" {...props} />
export const CheckCircle2 = (props) => <UiMark name="CheckCircle2" {...props} />
export const Circle = (props) => <UiMark name="Circle" {...props} />
export const AlertTriangle = (props) => <UiMark name="AlertTriangle" {...props} />
export const UserCheck = (props) => <UiMark name="UserCheck" {...props} />
export const Gauge = (props) => <UiMark name="Gauge" {...props} />
export const LockKeyhole = (props) => <UiMark name="LockKeyhole" {...props} />
export const Plus = (props) => <UiMark name="Plus" {...props} />
export const Pencil = (props) => <UiMark name="Pencil" {...props} />
export const Check = (props) => <UiMark name="Check" {...props} />
export const Download = (props) => <UiMark name="Download" {...props} />
export const Clock = (props) => <UiMark name="Clock" {...props} />
export const Book = (props) => <UiMark name="Book" {...props} />
export const XCircle = (props) => <UiMark name="XCircle" {...props} />
export const ChevronDown = (props) => <UiMark name="ChevronDown" {...props} />
