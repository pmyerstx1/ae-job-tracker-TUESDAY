export const companies: Array<
  | { provider: "greenhouse"; name: string; boardToken: string }
  | { provider: "lever"; name: string; site: string }
  | { provider: "workday"; name: string; tenant: string; site?: string; siteCandidates?: string[]; region?: string }
  | { provider: "amazon"; name: string; keywords?: string[] }
  | { provider: "ashby"; name: string; slug: string }
  | { provider: "teamtailor"; name: string; slug: string }
  | { provider: "smartrecruiters"; name: string; companyId: string }
  | { provider: "icims"; name: string; slug: string }
> = [
  // Start with just these 3 that we know worked in the original demo
  { provider: "greenhouse", name: "Stripe", boardToken: "stripe" },
  { provider: "lever", name: "Anthropic", site: "anthropic" },
  { provider: "amazon", name: "AWS", keywords: ["account executive", "enterprise"] },
]
