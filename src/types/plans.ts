export type PlanType = 'free' | 'pro';

export interface PlanDetails {
  type: PlanType;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  prompts: number;
  features: string[];
}

export const PLAN_CREDITS = {
  free: 30,
  pro: 200
} as const;

export const DEFAULT_PLAN: PlanDetails = {
  type: 'free',
  name: 'Free',
  monthlyPrice: 0,
  yearlyPrice: 0,
  prompts: PLAN_CREDITS.free,
  features: [
    '10 prompts per month',
    'All browsers supported',
    'Code export & download',
    'Community support',
    'Basic templates'
  ]
};

export const PRO_PLAN: PlanDetails = {
  type: 'pro',
  name: 'Pro',
  monthlyPrice: 999,
  yearlyPrice: 9999,
  prompts: PLAN_CREDITS.pro,
  features: [
    '500 prompts per month',
    'Fastest generation',
    'Custom branding',
    'Priority support 24/7',
    'API access',
    'Team collaboration',
    'Advanced analytics'
  ]
};