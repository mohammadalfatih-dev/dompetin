import React from 'react';
import {
  Building2,
  Landmark,
  Smartphone,
  Wallet as WalletLucide,
  Banknote,
  CreditCard,
  PiggyBank,
  CircleDollarSign,
} from 'lucide-react';
import { WalletType } from '../types/finance';

export const WALLET_ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Building2,
  Landmark,
  Smartphone,
  Wallet: WalletLucide,
  Banknote,
  CreditCard,
  PiggyBank,
  CircleDollarSign,
};

interface WalletIconProps {
  iconName?: string;
  type?: WalletType;
  className?: string;
  color?: string;
}

export const WalletIcon: React.FC<WalletIconProps> = ({
  iconName,
  type,
  className = 'w-5 h-5',
  color,
}) => {
  let Component = iconName ? WALLET_ICON_MAP[iconName] : undefined;

  if (!Component) {
    switch (type) {
      case 'bank':
        Component = Landmark;
        break;
      case 'ewallet':
        Component = Smartphone;
        break;
      case 'cash':
        Component = Banknote;
        break;
      case 'savings':
        Component = PiggyBank;
        break;
      case 'credit':
        Component = CreditCard;
        break;
      default:
        Component = WalletLucide;
        break;
    }
  }

  return (
    <span style={{ color: color || 'currentColor' }} className="inline-flex items-center justify-center">
      <Component className={className} />
    </span>
  );
};
