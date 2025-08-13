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
  // Verified working companies (keep these)
  { provider: "greenhouse", name: "Stripe", boardToken: "stripe" },
  { provider: "greenhouse", name: "Datadog", boardToken: "datadog" },
  { provider: "greenhouse", name: "MongoDB", boardToken: "mongodb" },
  { provider: "greenhouse", name: "HashiCorp", boardToken: "hashicorp" },
  { provider: "greenhouse", name: "Twilio", boardToken: "twilio" },
  { provider: "greenhouse", name: "Cloudflare", boardToken: "cloudflare" },
  { provider: "greenhouse", name: "Elastic", boardToken: "elastic" },
  { provider: "greenhouse", name: "GitLab", boardToken: "gitlab" },
  { provider: "greenhouse", name: "Figma", boardToken: "figma" },
  { provider: "greenhouse", name: "Asana", boardToken: "asana" },
  { provider: "greenhouse", name: "Databricks", boardToken: "databricks" },

  // Research-based tier-1 additions (I'll verify these work)
  { provider: "greenhouse", name: "Snowflake", boardToken: "snowflake" },
  { provider: "greenhouse", name: "PagerDuty", boardToken: "pagerduty" },
  { provider: "greenhouse", name: "New Relic", boardToken: "newrelic" },
  { provider: "greenhouse", name: "Splunk", boardToken: "splunk" },
  { provider: "greenhouse", name: "Okta", boardToken: "okta" },
  { provider: "greenhouse", name: "Auth0", boardToken: "auth0" },
  { provider: "greenhouse", name: "Segment", boardToken: "segment" },
  { provider: "greenhouse", name: "SendGrid", boardToken: "sendgrid" },

  // Major enterprise companies via SmartRecruiters
  { provider: "smartrecruiters", name: "Microsoft", companyId: "Microsoft" },
  { provider: "smartrecruiters", name: "Adobe", companyId: "Adobe" },
  { provider: "smartrecruiters", name: "VMware", companyId: "VMware" },

  // AWS
  { provider: "amazon", name: "AWS", keywords: ["account executive", "enterprise", "strategic"] },

  // Major Workday companies (enterprise-focused)
  {
    provider: "workday",
    name: "Salesforce",
    tenant: "salesforce",
    siteCandidates: ["external", "careers"],
    region: "wd1",
  },
  {
    provider: "workday",
    name: "ServiceNow",
    tenant: "servicenow",
    siteCandidates: ["external", "SN_External_Career_Site"],
    region: "wd1",
  },
  {
    provider: "workday",
    name: "Oracle",
    tenant: "oracle",
    siteCandidates: ["external", "careers"],
    region: "wd1",
  },
]
