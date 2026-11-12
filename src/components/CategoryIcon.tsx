import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Store,
  TrendingUp,
  Gift,
  PlusCircle,
  Coffee,
  Film,
  Plane,
  Home,
  Smartphone,
  ShieldCheck,
  Tag,
  ArrowRightLeft,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Store,
  TrendingUp,
  Gift,
  PlusCircle,
  Coffee,
  Film,
  Plane,
  Home,
  Smartphone,
  ShieldCheck,
  Tag,
  ArrowRightLeft,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
  backgroundColor?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  color,
  backgroundColor,
}) => {
  const IconComponent = CATEGORY_ICON_MAP[name] || Tag;

  const style: React.CSSProperties = {
    color: color || 'currentColor',
    backgroundColor: backgroundColor || 'transparent',
  };

  return (
    <div
      style={style}
      className={`inline-flex items-center justify-center shrink-0 ${backgroundColor ? 'p-2 rounded-xl' : ''}`}
    >
      <IconComponent className={className} />
    </div>
  );
};
