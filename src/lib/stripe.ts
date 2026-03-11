import Stripe from "stripe";

// Use placeholder during build when env vars may be empty; real key required at runtime
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export const HOSTING_PLANS = {
  starter: {
    name: "Starter",
    monthlyPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_STARTER_ANNUAL,
    monthlyAmount: 0,
    annualAmount: 0,
  },
  pro: {
    name: "Pro",
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_PRO_ANNUAL,
    monthlyAmount: 900,   // cents
    annualAmount: 9000,
  },
  business: {
    name: "Business",
    monthlyPriceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
    monthlyAmount: 2900,
    annualAmount: 29000,
  },
} as const;

export type PlanSlug = keyof typeof HOSTING_PLANS;
export type BillingInterval = "monthly" | "annual";
