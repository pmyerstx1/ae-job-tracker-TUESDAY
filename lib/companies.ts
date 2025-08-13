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

  // SNOWFLAKE - Test multiple approaches systematically
  { provider: "greenhouse", name: "Snowflake (test1)", boardToken: "snowflake" },
  { provider: "greenhouse", name: "Snowflake (test2)", boardToken: "snowflakecomputing" },
  { provider: "greenhouse", name: "Snowflake (test3)", boardToken: "snowflakeinc" },
  { provider: "greenhouse", name: "Snowflake (test4)", boardToken: "snowflakedb" },
  { provider: "greenhouse", name: "Snowflake (test5)", boardToken: "snowflake-inc" },
  { provider: "smartrecruiters", name: "Snowflake (SR)", companyId: "Snowflake" },
  { provider: "smartrecruiters", name: "Snowflake (SR2)", companyId: "SnowflakeInc" },
  {
    provider: "workday",
    name: "Snowflake (WD)",
    tenant: "snowflake",
    siteCandidates: ["external", "careers", "jobs"],
    region: "wd1",
  },

  // Research-based additions (likely to work based on patterns)
  { provider: "greenhouse", name: "Sumo Logic", boardToken: "sumologic" },
  { provider: "greenhouse", name: "LaunchDarkly", boardToken: "launchdarkly" },
  { provider: "greenhouse", name: "Fastly", boardToken: "fastly" },
  { provider: "greenhouse", name: "Cockroach Labs", boardToken: "cockroachlabs" },
  { provider: "greenhouse", name: "Temporal", boardToken: "temporal" },

  // Enterprise companies via SmartRecruiters (working but no matches yet)
  { provider: "smartrecruiters", name: "Microsoft", companyId: "Microsoft" },
  { provider: "smartrecruiters", name: "Adobe", companyId: "Adobe" },
  { provider: "smartrecruiters", name: "VMware", companyId: "VMware" },

  // AWS
  { provider: "amazon", name: "AWS", keywords: ["account executive", "enterprise", "strategic"] },
]
