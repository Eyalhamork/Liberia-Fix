// lib/constants/wallet.ts
// CORRECTED FOR LAUNCH PRICING

// ============================================
// PRICING STRATEGY
// ============================================
// Launch: $1 per booking
// Post-launch: $3 per booking
// ============================================

export const BOOKING_FEE_CREDITS = 1; // 1 credit per booking
export const BOOKING_FEE_AMOUNT_LAUNCH = 1.0; // $1 during launch
export const BOOKING_FEE_AMOUNT_REGULAR = 3.0; // $3 post-launch

// Current active pricing (change this after launch)
export const BOOKING_FEE_AMOUNT = BOOKING_FEE_AMOUNT_LAUNCH; // ⬅️ CURRENTLY $1

export interface CreditPackage {
  id: string;
  amount: number; // USD amount to pay
  credits: number; // Base credits received
  bonus: number; // Bonus credits
  label: string;
  popular?: boolean;
  badge?: string;
  savings?: string;
}

// ============================================
// LAUNCH PRICING ($1 per credit)
// ============================================
export const CREDIT_PACKAGES_LAUNCH: CreditPackage[] = [
  {
    id: "single",
    amount: 1,
    credits: 1,
    bonus: 0,
    label: "Single Booking",
    popular: false,
  },
  {
    id: "starter",
    amount: 3,
    credits: 4,
    bonus: 1,
    label: "Starter Pack",
    popular: true,
    badge: "Best Value",
    savings: "Get 1 FREE!",
  },
  {
    id: "power",
    amount: 7,
    credits: 8,
    bonus: 1,
    label: "Power User",
    popular: false,
    savings: "Get 1 FREE!",
  },
  {
    id: "premium",
    amount: 15,
    credits: 20,
    bonus: 5,
    label: "Premium Pack",
    popular: false,
    badge: "Max Bonus",
    savings: "Get 5 FREE!",
  },
];

// ============================================
// POST-LAUNCH PRICING ($3 per credit)
// ============================================
export const CREDIT_PACKAGES_REGULAR: CreditPackage[] = [
  {
    id: "single",
    amount: 3,
    credits: 1,
    bonus: 0,
    label: "Single Booking",
    popular: false,
  },
  {
    id: "starter",
    amount: 10,
    credits: 4,
    bonus: 1,
    label: "Starter Pack",
    popular: true,
    badge: "Best Value",
    savings: "Get 1 FREE!",
  },
  {
    id: "power",
    amount: 20,
    credits: 8,
    bonus: 2,
    label: "Power User",
    popular: false,
    savings: "Get 2 FREE!",
  },
  {
    id: "premium",
    amount: 50,
    credits: 20,
    bonus: 5,
    label: "Premium Pack",
    popular: false,
    badge: "Max Bonus",
    savings: "Get 5 FREE!",
  },
];

// ============================================
// ACTIVE PACKAGES (Switch after launch)
// ============================================
export const CREDIT_PACKAGES = CREDIT_PACKAGES_LAUNCH; // ⬅️ CURRENTLY LAUNCH PRICING

// Helper function to get total credits including bonus
export function getTotalCredits(pkg: CreditPackage): number {
  return pkg.credits + pkg.bonus;
}

export function getCreditPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id);
}

export function calculateTotalCredits(packageId: string): number {
  const pkg = getCreditPackageById(packageId);
  if (!pkg) return 0;
  return getTotalCredits(pkg);
}

// Calculate savings
export function calculateSavings(pkg: CreditPackage): number {
  const totalCredits = getTotalCredits(pkg);
  const regularPrice = totalCredits * BOOKING_FEE_AMOUNT;
  return regularPrice - pkg.amount;
}

// ============================================
// WALLET TRANSACTION TYPES
// ============================================
export type WalletTransactionType =
  | "topup"
  | "deduct"
  | "bonus"
  | "refund"
  | "referral_bonus"
  | "welcome_bonus";

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: WalletTransactionType;
  amount: number;
  credits_amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  payment_transaction_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WalletBalance {
  balance: number;
  recent_transactions: WalletTransaction[];
  pending_topups?: any[];
}

// ============================================
// PAYMENT PRIORITY
// ============================================
// When customer books, check in this order:
// 1. Wallet credits → Free (deduct 1 credit)
// 2. No credits → Pay directly ($1 launch / $3 regular)

export interface BookingPaymentOptions {
  wallet_balance: number;
  can_use_wallet: boolean;
  requires_payment: boolean;
  payment_amount: number;
}

export function getBookingPaymentOptions(
  walletBalance: number
): BookingPaymentOptions {
  if (walletBalance >= BOOKING_FEE_CREDITS) {
    return {
      wallet_balance: walletBalance,
      can_use_wallet: true,
      requires_payment: false,
      payment_amount: 0,
    };
  }

  return {
    wallet_balance: walletBalance,
    can_use_wallet: false,
    requires_payment: true,
    payment_amount: BOOKING_FEE_AMOUNT,
  };
}

// ============================================
// PROMOTIONAL BONUSES
// ============================================
export const REFERRAL_BONUS_CREDITS = 1.0; // Referrer gets 1 credit
export const WELCOME_BONUS_CREDITS = 0.5; // New user gets 0.5 credit

// Launch promo
export const LAUNCH_PROMO = {
  code: "HOLIDAY2024",
  bonus_credits: 0.5,
  max_uses: 1000,
  expires_at: "2025-01-15",
  description: "First 1000 customers get 0.5 free credits!",
};

// ============================================
// TO SWITCH TO POST-LAUNCH PRICING:
// ============================================
// 1. Change: export const CREDIT_PACKAGES = CREDIT_PACKAGES_REGULAR;
// 2. Change: export const BOOKING_FEE_AMOUNT = BOOKING_FEE_AMOUNT_REGULAR;
// 3. Update bookings.booking_fee default in database to 3.00
// 4. Announce price change to users 1 week in advance
// ============================================
