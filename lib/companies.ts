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

  // High-priority companies - try alternative tokens
  { provider: "greenhouse", name: "Snowflake", boardToken: "snowflake" }, // Try without "computing"
  { provider: "greenhouse", name: "Cloudflare", boardToken: "cloudflare" },
  { provider: "greenhouse", name: "Elastic", boardToken: "elastic" },
  { provider: "greenhouse", name: "Confluent", boardToken: "confluent" },
  { provider: "greenhouse", name: "GitLab", boardToken: "gitlab" },
  { provider: "greenhouse", name: "Figma", boardToken: "figma" },
  { provider: "greenhouse", name: "Asana", boardToken: "asana" },
  { provider: "greenhouse", name: "CrowdStrike", boardToken: "crowdstrike" },
  { provider: "greenhouse", name: "Databricks", boardToken: "databricks" },
  { provider: "greenhouse", name: "Atlassian", boardToken: "atlassian" },

  // AWS
  { provider: "amazon", name: "AWS", keywords: ["account executive", "enterprise", "strategic"] },

  // High-priority Lever companies - keep trying
  { provider: "lever", name: "Ramp", site: "ramp" },
  { provider: "lever", name: "Brex", site: "brex" },
  { provider: "lever", name: "Anthropic", site: "anthropic" },
  { provider: "lever", name: "Canva", site: "canva" },

  // Ashby alternatives
  { provider: "ashby", name: "Linear", slug: "linear" },
  { provider: "ashby", name: "Retool", slug: "retool" },
  { provider: "ashby", name: "Vanta", slug: "vanta" },

  // Major enterprise companies via Workday
  {
    provider: "workday",
    name: "Salesforce",
    tenant: "salesforce",
    siteCandidates: ["careers", "jobs", "external"],
    region: "wd1",
  },
  {
    provider: "workday",
    name: "Adobe",
    tenant: "adobe",
    siteCandidates: ["external_experienced", "experienced", "careers"],
    region: "wd5",
  },
]
