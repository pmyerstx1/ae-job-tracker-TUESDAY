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
  // Tier-1 working companies (verified high job counts)
  { provider: "greenhouse", name: "Databricks", boardToken: "databricks" },
  { provider: "greenhouse", name: "Okta", boardToken: "okta" },
  { provider: "greenhouse", name: "Datadog", boardToken: "datadog" },
  { provider: "greenhouse", name: "GitLab", boardToken: "gitlab" },
  { provider: "greenhouse", name: "Elastic", boardToken: "elastic" },
  { provider: "greenhouse", name: "Cloudflare", boardToken: "cloudflare" },
  { provider: "greenhouse", name: "MongoDB", boardToken: "mongodb" },
  { provider: "greenhouse", name: "Stripe", boardToken: "stripe" },

  // Solid mid-tier companies (verified working)
  { provider: "greenhouse", name: "New Relic", boardToken: "newrelic" },
  { provider: "greenhouse", name: "Twilio", boardToken: "twilio" },
  { provider: "greenhouse", name: "HashiCorp", boardToken: "hashicorp" },
  { provider: "greenhouse", name: "Figma", boardToken: "figma" },
  { provider: "greenhouse", name: "Asana", boardToken: "asana" },
  { provider: "greenhouse", name: "PagerDuty", boardToken: "pagerduty" },

  // Research-based working additions
  { provider: "greenhouse", name: "Sumo Logic", boardToken: "sumologic" },
  { provider: "greenhouse", name: "LaunchDarkly", boardToken: "launchdarkly" },
  { provider: "greenhouse", name: "Fastly", boardToken: "fastly" },
  { provider: "greenhouse", name: "Cockroach Labs", boardToken: "cockroachlabs" },
  { provider: "greenhouse", name: "Temporal", boardToken: "temporal" },

  // SNOWFLAKE - Try SmartRecruiters (they might have switched)
  { provider: "smartrecruiters", name: "Snowflake", companyId: "Snowflake" },

  // Enterprise companies via SmartRecruiters
  { provider: "smartrecruiters", name: "Microsoft", companyId: "Microsoft" },
  { provider: "smartrecruiters", name: "Adobe", companyId: "Adobe" },
  { provider: "smartrecruiters", name: "VMware", companyId: "VMware" },

  // AWS
  { provider: "amazon", name: "AWS", keywords: ["account executive", "enterprise", "strategic"] },

  // Add more tier-1 companies while we figure out Snowflake
  { provider: "greenhouse", name: "Confluent", boardToken: "confluent" },
  { provider: "greenhouse", name: "Zscaler", boardToken: "zscaler" },
  { provider: "greenhouse", name: "CrowdStrike", boardToken: "crowdstrike" },
]
