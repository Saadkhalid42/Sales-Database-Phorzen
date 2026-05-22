import * as Popover from '@radix-ui/react-popover';
import { 
  Activity, Briefcase, Building, BarChart, Database, FileText, Server, Shield, 
  Users, UserCircle, Settings, Mail, MessageSquare, Calendar, Globe, Monitor, 
  Smartphone, Tablet, HardDrive, Cpu, Cloud, Wifi, Layers, Layout, Target,
  Crosshair, Anchor, Compass, Map, Navigation, ShieldCheck, ShieldAlert,
  Lock, Unlock, Key, FileCheck, FileCode, FileDigit, FileKey, FileSearch,
  FolderOpen, FolderClosed, Book, Bookmark, Stethoscope, Heart,
  Pill, Syringe, ActivitySquare, Cross, Biohazard,
  AlertCircle, AlertTriangle, Info, CheckCircle, XCircle, HelpCircle,
  PlusCircle, MinusCircle, DivideCircle, Percent, Hash, AtSign, Search,
  ZoomIn, ZoomOut, Maximize, Minimize, Camera, Video, Mic, Headphones,
  Volume, Volume1, Volume2, VolumeX, Music, Play, Pause, Square, Circle,
  Triangle, Hexagon, Octagon, Star, Flame, Droplet,
  CloudRain, CloudSnow, CloudLightning, Sun, Moon, Wind, Thermometer,
  Umbrella, Zap, Battery, BatteryCharging, BatteryFull, BatteryMedium,
  BatteryLow, Power, Link, Link2, Paperclip, Share, Share2, CornerUpLeft,
  CornerUpRight, CornerDownLeft, CornerDownRight, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, FastForward, Rewind,
  SkipBack, SkipForward, Repeat, Shuffle, Cast, Airplay, Clock, Watch,
  Timer, Hourglass, CalendarDays, CalendarClock, ShoppingCart, ShoppingBag,
  CreditCard, DollarSign, Euro, Banknote, Coins, Wallet, Gift,
  Package, Truck, Plane, Ship, Bus, Car, Bike, Train
} from 'lucide-react';
import React from 'react';

// Pre-curated list of highly professional icons
const ICONS: Record<string, React.ElementType> = {
  Activity, Briefcase, Building, BarChart, Database, FileText, Server, Shield,
  Users, UserCircle, Settings, Mail, MessageSquare, Calendar, Globe, Monitor,
  Smartphone, Tablet, HardDrive, Cpu, Cloud, Wifi, Layers, Layout, Target,
  Crosshair, Anchor, Compass, Map, Navigation, ShieldCheck, ShieldAlert,
  Lock, Unlock, Key, FileCheck, FileCode, FileDigit, FileKey, FileSearch,
  FolderOpen, FolderClosed, Book, Bookmark, Stethoscope, Heart,
  Pill, Syringe, ActivitySquare, Cross, Biohazard,
  AlertCircle, AlertTriangle, Info, CheckCircle, XCircle, HelpCircle,
  PlusCircle, MinusCircle, DivideCircle, Percent, Hash, AtSign, Search,
  ZoomIn, ZoomOut, Maximize, Minimize, Camera, Video, Mic, Headphones,
  Volume, Volume1, Volume2, VolumeX, Music, Play, Pause, Square, Circle,
  Triangle, Hexagon, Octagon, Star, Flame, Droplet,
  CloudRain, CloudSnow, CloudLightning, Sun, Moon, Wind, Thermometer,
  Umbrella, Zap, Battery, BatteryCharging, BatteryFull, BatteryMedium,
  BatteryLow, Power, Link, Link2, Paperclip, Share, Share2, CornerUpLeft,
  CornerUpRight, CornerDownLeft, CornerDownRight, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, FastForward, Rewind,
  SkipBack, SkipForward, Repeat, Shuffle, Cast, Airplay, Clock, Watch,
  Timer, Hourglass, CalendarDays, CalendarClock, ShoppingCart, ShoppingBag,
  CreditCard, DollarSign, Euro, Banknote, Coins, Wallet, Gift,
  Package, Truck, Plane, Ship, Bus, Car, Bike, Train
};

// Colors based on Tailwind standard palette (500 weight usually)
const COLORS = [
  '#64748b', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#1e293b', '#0f172a'
];

interface IconColorPickerProps {
  icon: string;
  color: string;
  onChange: (icon: string, color: string) => void;
}

export function IconColorPicker({ icon, color, onChange }: IconColorPickerProps) {
  const ActiveIcon = ICONS[icon] || ICONS['Database'];
  
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button 
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-md border border-primary/30 hover:bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
          style={{ color: color }}
        >
          <ActiveIcon size={20} />
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content 
          className="w-[300px] border border-border shadow-2xl rounded-xl p-3 z-[2000] bg-surface-raised data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={8}
          align="start"
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange(icon, c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-accent' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            
            <div className="h-px bg-divider" />
            
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Icon</p>
              <div className="grid grid-cols-6 gap-1 h-48 overflow-y-auto pr-1 no-scrollbar">
                {Object.keys(ICONS).map(iconName => {
                  const IconComp = ICONS[iconName];
                  const isSelected = icon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => onChange(iconName, color)}
                      className={`flex justify-center items-center p-1.5 rounded-md transition-colors focus:outline-none ${isSelected ? 'bg-divider text-primary' : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'}`}
                      style={{ color: isSelected ? color : undefined }}
                    >
                      <IconComp size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { ICONS };
