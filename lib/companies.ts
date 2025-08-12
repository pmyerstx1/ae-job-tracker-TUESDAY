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
  // Known working
  { provider: "greenhouse", name: "Stripe", boardToken: "stripe" },
  { provider: "amazon", name: "AWS", keywords: ["account executive", "enterprise"] },

  // High-confidence Greenhouse (major companies likely to maintain APIs)
  { provider: "greenhouse", name: "Datadog", boardToken: "datadog" },
  { provider: "greenhouse", name: "Snowflake", boardToken: "snowflakecomputing" },
  { provider: "greenhouse", name: "MongoDB", boardToken: "mongodb" },
  { provider: "greenhouse", name: "HashiCorp", boardToken: "hashicorp" },
  { provider: "greenhouse", name: "HubSpot", boardToken: "hubspot" },
  { provider: "greenhouse", name: "Twilio", boardToken: "twilio" },

  // High-confidence Lever
  { provider: "lever", name: "Ramp", site: "ramp" },
  { provider: "lever", name: "Brex", site: "brex" },
  { provider: "lever", name: "Mercury", site: "mercury" },
]
