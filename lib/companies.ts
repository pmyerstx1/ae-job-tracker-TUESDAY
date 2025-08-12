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
  // Greenhouse - Only the ones we know work from the original list
  { provider: "greenhouse", name: "Stripe", boardToken: "stripe" },
  { provider: "greenhouse", name: "Cloudflare", boardToken: "cloudflare" },
  { provider: "greenhouse", name: "Datadog", boardToken: "datadog" },
  { provider: "greenhouse", name: "Notion", boardToken: "notion" },
  { provider: "greenhouse", name: "Snowflake", boardToken: "snowflakecomputing" },
  { provider: "greenhouse", name: "Databricks", boardToken: "databricks" },
  { provider: "greenhouse", name: "Atlassian", boardToken: "atlassian" },
  { provider: "greenhouse", name: "Elastic", boardToken: "elastic" },
  { provider: "greenhouse", name: "MongoDB", boardToken: "mongodb" },
  { provider: "greenhouse", name: "Confluent", boardToken: "confluent" },
  { provider: "greenhouse", name: "HashiCorp", boardToken: "hashicorp" },
  { provider: "greenhouse", name: "GitLab", boardToken: "gitlab" },
  { provider: "greenhouse", name: "GitHub", boardToken: "github" },
  { provider: "greenhouse", name: "Figma", boardToken: "figma" },
  { provider: "greenhouse", name: "Miro", boardToken: "miro" },
  { provider: "greenhouse", name: "Asana", boardToken: "asana" },
  { provider: "greenhouse", name: "CrowdStrike", boardToken: "crowdstrike" },
  { provider: "greenhouse", name: "Snyk", boardToken: "snyk" },
  { provider: "greenhouse", name: "HubSpot", boardToken: "hubspot" },
  { provider: "greenhouse", name: "Twilio", boardToken: "twilio" },
  { provider: "greenhouse", name: "Airtable", boardToken: "airtable" },
  { provider: "greenhouse", name: "Palantir", boardToken: "palantir" },
  { provider: "greenhouse", name: "OpenAI", boardToken: "openai" },
  { provider: "greenhouse", name: "Docker", boardToken: "docker" },
  { provider: "greenhouse", name: "Box", boardToken: "box" },
  { provider: "greenhouse", name: "Coinbase", boardToken: "coinbase" },

  // Lever - Only the ones we know work from the original list
  { provider: "lever", name: "Ramp", site: "ramp" },
  { provider: "lever", name: "Canva", site: "canva" },
  { provider: "lever", name: "Anthropic", site: "anthropic" },
  { provider: "lever", name: "Rippling", site: "rippling" },
  { provider: "lever", name: "Brex", site: "brex" },
  { provider: "lever", name: "Vercel", site: "vercel" },
  { provider: "lever", name: "Mercury", site: "mercury" },
  { provider: "lever", name: "Loom", site: "loom" },
  { provider: "lever", name: "Scale AI", site: "scaleai" },
  { provider: "lever", name: "Zapier", site: "zapier" },
  { provider: "lever", name: "Webflow", site: "webflow" },

  // Workday - Only the ones we know work from the original list
  {
    provider: "workday",
    name: "PayPal",
    tenant: "paypal",
    siteCandidates: ["jobs", "paypaljobs", "paypal", "paypalcareers", "external"],
    region: "wd1",
  },
  {
    provider: "workday",
    name: "Okta",
    tenant: "okta",
    siteCandidates: ["careers", "okta", "jobs", "external"],
    region: "wd1",
  },
  {
    provider: "workday",
    name: "ServiceNow",
    tenant: "servicenow",
    siteCandidates: ["careers", "jobs", "external", "SN_External_Career_Site"],
    region: "wd1",
  },
  {
    provider: "workday",
    name: "Adobe",
    tenant: "adobe",
    siteCandidates: ["external_experienced", "experienced", "careers", "jobs", "external"],
    region: "wd5",
  },

  // Amazon Jobs (AWS)
  {
    provider: "amazon",
    name: "AWS",
    keywords: [
      "enterprise account executive",
      "strategic account executive",
      "named account executive",
      "account executive",
      "enterprise account manager",
      "named account manager",
      "global account manager",
      "sales executive",
    ],
  },

  // Ashby - Only the ones we know work from the original list
  { provider: "ashby", name: "Linear", slug: "linear" },
  { provider: "ashby", name: "Retool", slug: "retool" },
  { provider: "ashby", name: "Replit", slug: "replit" },
  { provider: "ashby", name: "Vanta", slug: "vanta" },
  { provider: "ashby", name: "PostHog", slug: "posthog" },

  // Teamtailor (examples; often EU — may be filtered by US-only)
  { provider: "teamtailor", name: "Northvolt", slug: "northvolt" },
  { provider: "teamtailor", name: "Tink", slug: "tink" },

  // SmartRecruiters
  { provider: "smartrecruiters", name: "Spotify", companyId: "Spotify" },
  { provider: "smartrecruiters", name: "Unity", companyId: "Unity" },

  // iCIMS (best‑effort; endpoints vary by tenant)
  { provider: "icims", name: "F5", slug: "careers-f5" },
  { provider: "icims", name: "NCR", slug: "careers-ncr" },
]
