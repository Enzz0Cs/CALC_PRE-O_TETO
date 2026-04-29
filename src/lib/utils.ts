import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Brazilian Real (BRL).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formats a decimal number with fixed precision.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Calculates Graham's Intrinsic Value.
 * V = sqrt(22.5 * EPS * BVPS)
 */
export function calculateGrahamPrice(lpa: number, vpa: number): number | null {
  if (lpa === 0 || vpa === 0) return null;
  const result = 22.5 * lpa * vpa;
  return result < 0 ? 0 : Math.sqrt(result);
}

/**
 * Calculates Bazin's Fair Price.
 * Price = Dividend / Yield (default 6%)
 */
export function calculateBazinPrice(dividend: number, yieldTarget: number = 0.06): number | null {
  if (yieldTarget === 0) return null;
  const price = dividend / yieldTarget;
  return price < 0 ? 0 : price;
}
