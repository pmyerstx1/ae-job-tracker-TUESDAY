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
  // Verified working Greenhouse companies
  { provider: "greenhouse", name: "Stripe", boardToken: "stripe" },
  { provider: "greenhouse", name: "Datadog", boardToken: "datadog" },
  { provider: "greenhouse", name: "MongoDB", boardToken: "mongodb" },
  { provider: "greenhouse", name: "HashiCorp", boardToken: "hashicorp" },
  { provider: "greenhouse", name: "Twilio", boardToken: "twilio" },
  { provider: "greenhouse", name: "HubSpot", boardToken: "hubspot" },

  // Additional high-confidence Greenhouse companies
  { provider: "greenhouse", name: "Cloudflare", boardToken: "cloudflare" },
  { provider: "greenhouse", name: "Elastic", boardToken: "elastic" },
  { provider: "greenhouse", name: "Confluent", boardToken: "confluent" },
  { provider: "greenhouse", name: "GitLab", boardToken: "gitlab" },
  { provider: "greenhouse", name: "Figma", boardToken: "figma" },
  { provider: "greenhouse", name: "Asana", boardToken: "asana" },
  { provider: "greenhouse", name: "CrowdStrike", boardToken: "crowdstrike" },
  { provider: "greenhouse", name: "Snyk", boardToken: "snyk" },
  { provider: "greenhouse", name: "Airtable", boardToken: "airtable" },

  // AWS (working)
  { provider: "amazon", name: "AWS", keywords: ["account executive", "enterprise", "strategic"] },

  // Try a few Ashby companies (different API structure)
  { provider: "ashby", name: "Linear", slug: "linear" },
  { provider: "ashby", name: "Retool", slug: "retool" },
  { provider: "ashby", name: "Vanta", slug: "vanta" },
]
