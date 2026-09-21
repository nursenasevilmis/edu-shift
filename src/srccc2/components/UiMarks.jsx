import {
  LayoutGrid as LayoutGridIcon,
  CalendarClock as CalendarClockIcon,
  Layers as LayersIcon,
  BookOpen as BookOpenIcon,
  Users as UsersIcon,
  CalendarX as CalendarXIcon,
  ClipboardList as ClipboardListIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  ShieldCheck as ShieldCheckIcon,
  BookMarked as BookMarkedIcon,
  Menu as MenuIcon,
  X as XIcon,
  ChevronRight as ChevronRightIcon,
  Sparkles as SparklesIcon,
  LogOut as LogOutIcon,
  CircleHelp as CircleHelpIcon,
  ArrowUpRight as ArrowUpRightIcon,
  Wand2 as Wand2Icon,
  CalendarDays as CalendarDaysIcon,
  Trash2 as Trash2Icon,
  Info as InfoIcon,
  ArrowRight as ArrowRightIcon,
  CheckCircle2 as CheckCircle2Icon,
  Circle as CircleIcon,
  AlertTriangle as AlertTriangleIcon,
  UserCheck as UserCheckIcon,
  Gauge as GaugeIcon,
  LockKeyhole as LockKeyholeIcon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  Clock as ClockIcon,
  Book as BookIcon,
  XCircle as XCircleIcon,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react'

function createIcon(Icon) {
  return function UiIcon({ size = 16, strokeWidth = 1.8, ...props }) {
    return <Icon size={size} strokeWidth={strokeWidth} {...props} />
  }
}

export const LayoutGrid = createIcon(LayoutGridIcon)
export const CalendarClock = createIcon(CalendarClockIcon)
export const Layers = createIcon(LayersIcon)
export const BookOpen = createIcon(BookOpenIcon)
export const Users = createIcon(UsersIcon)
export const CalendarX = createIcon(CalendarXIcon)
export const ClipboardList = createIcon(ClipboardListIcon)
export const SlidersHorizontal = createIcon(SlidersHorizontalIcon)
export const ShieldCheck = createIcon(ShieldCheckIcon)
export const BookMarked = createIcon(BookMarkedIcon)
export const Menu = createIcon(MenuIcon)
export const X = createIcon(XIcon)
export const ChevronRight = createIcon(ChevronRightIcon)
export const Sparkles = createIcon(SparklesIcon)
export const LogOut = createIcon(LogOutIcon)
export const CircleHelp = createIcon(CircleHelpIcon)
export const ArrowUpRight = createIcon(ArrowUpRightIcon)
export const Wand2 = createIcon(Wand2Icon)
export const CalendarDays = createIcon(CalendarDaysIcon)
export const Trash2 = createIcon(Trash2Icon)
export const Info = createIcon(InfoIcon)
export const ArrowRight = createIcon(ArrowRightIcon)
export const CheckCircle2 = createIcon(CheckCircle2Icon)
export const Circle = createIcon(CircleIcon)
export const AlertTriangle = createIcon(AlertTriangleIcon)
export const UserCheck = createIcon(UserCheckIcon)
export const Gauge = createIcon(GaugeIcon)
export const LockKeyhole = createIcon(LockKeyholeIcon)
export const Plus = createIcon(PlusIcon)
export const Pencil = createIcon(PencilIcon)
export const Check = createIcon(CheckIcon)
export const Download = createIcon(DownloadIcon)
export const Clock = createIcon(ClockIcon)
export const Book = createIcon(BookIcon)
export const XCircle = createIcon(XCircleIcon)
export const ChevronDown = createIcon(ChevronDownIcon)
