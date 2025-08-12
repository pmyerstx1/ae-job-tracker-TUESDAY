import { NextResponse } from "next/server"
import { companies } from "@/lib/companies"
import { filterIsEnterpriseAE } from "@/lib/filter"

type Job = {
  id: string
  title: string
  company: string
  location?: string
  url: string
  department?: string
  createdAt: string
  source: "greenhouse" | "lever" | "workday" | "amazon" | "ashby" | "teamtailor" | "smartrecruiters" | "icims"
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const days = clampInt(searchParams.get("days"), 1, 365, 7)
  const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000
  const onlyRemote = searchParams.get("remote") === "1"
  const usOrRemoteUS = searchParams.get("us_or_remote_us") === "1"
  const allowNAremote = searchParams.get("na_remote_ok") === "1"

  const results = await Promise.allSettled(
    companies.map((c) => {
      switch (c.provider) {
        case "greenhouse":
          return fetchGreenhouse(c.boardToken, c.name)
        case "lever":
          return fetchLever(c.site, c.name)
        case "workday":
          return fetchWorkday(c, c.name)
        case "amazon":
          return fetchAmazonJobs(c, c.name)
        case "ashby":
          return fetchAshby(c.slug, c.name)
        case "teamtailor":
          return fetchTeamtailor(c.slug, c.name)
        case "smartrecruiters":
          return fetchSmartRecruiters(c.companyId, c.name)
        case "icims":
          return fetchICIMS(c.slug, c.name)
        default:
          return Promise.resolve([] as Job[])
      }
    }),
  )

  const jobs: Job[] = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))

  const filtered = jobs
    .filter((j) => {
      if (!filterIsEnterpriseAE(j.title)) return false

      const created = new Date(j.createdAt).getTime()
      if (isFinite(created) ? created < sinceMs : false) return false

      if (onlyRemote) {
        return isRemoteAny(j.location ?? "")
      }

      if (usOrRemoteUS) {
        return passesLocationGate(j, { allowNAremote })
      }

      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json(filtered, { headers: { "cache-control": "no-store" } })
}

/**
 * Providers
 */
async function fetchGreenhouse(boardToken: string, company: string): Promise<Job[]> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`
    const res = await fetch(url, { headers: { accept: "application/json" } })
    if (!res.ok) return []
    const data = (await res.json()) as {
      jobs: Array<{
        id: number
        title: string
        absolute_url: string
        location?: { name?: string }
        departments?: Array<{ name: string }>
        updated_at?: string
        created_at?: string
      }>
    }
    return (data.jobs ?? []).map((j) => ({
      id: String(j.id),
      title: j.title,
      company,
      location: j.location?.name,
      url: j.absolute_url,
      department: j.departments && j.departments.length ? j.departments[0]?.name : undefined,
      createdAt: j.created_at || j.updated_at || new Date().toISOString(),
      source: "greenhouse" as const,
    }))
  } catch {
    return []
  }
}

async function fetchLever(site: string, company: string): Promise<Job[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`
    const res = await fetch(url, { headers: { accept: "application/json" } })
    if (!res.ok) return []
    const data = (await res.json()) as Array<{
      id: string
      text: string
      hostedUrl: string
      createdAt?: number
      categories?: { location?: string; team?: string }
    }>
    return data.map((j) => ({
      id: j.id,
      title: j.text,
      company,
      location: j.categories?.location,
      url: j.hostedUrl,
      department: j.categories?.team,
      createdAt: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
      source: "lever" as const,
    }))
  } catch {
    return []
  }
}

async function fetchWorkday(
  cfg: { tenant: string; site?: string; siteCandidates?: string[]; region?: string },
  company: string,
): Promise<Job[]> {
  const region = cfg.region || "wd1"
  const tenant = cfg.tenant
  const sites = dedupeArray(
    [cfg.site, ...(cfg.siteCandidates || []), "jobs", "careers", tenant].filter(Boolean) as string[],
  )

  for (const site of sites) {
    try {
      const url = `https://${tenant}.${region}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
        },
        body: JSON.stringify({ appliedFacets: {}, limit: 100, offset: 0, searchText: "" }),
      })
      if (!res.ok) continue
      const data = (await res.json()) as any
      const postings: any[] = data?.jobPostings || data?.results || []
      if (!Array.isArray(postings) || postings.length === 0) continue

      return postings.map((p) => {
        const title: string = p.title || p.bulletFields?.title || "Job"
        const externalPath: string =
          p.externalPath || p.externalUrlPath || p.externalURL || p.externalUrl || p.uri || ""
        const locationsText: string =
          p.locationsText ||
          p.locations?.map((l: any) => [l.city, l.state, l.country].filter(Boolean).join(", ")).join(" • ") ||
          p.location ||
          ""
        const posted = p.postedOn || p.postedDate || p.publicationDate || p.latestUpdateDateTime || p.postedDateTime

        const createdAt = posted ? new Date(posted).toISOString() : new Date().toISOString()
        const url = externalPath
          ? `https://${tenant}.${region}.myworkdayjobs.com/en-US/${site}${
              externalPath.startsWith("/") ? externalPath : `/${externalPath}`
            }`
          : `https://${tenant}.${region}.myworkdayjobs.com/en-US/${site}`

        return {
          id: externalPath || `${title}-${url}`,
          title,
          company,
          location: locationsText,
          url,
          department: undefined,
          createdAt,
          source: "workday" as const,
        } satisfies Job
      })
    } catch {
      continue
    }
  }
  return []
}

async function fetchAmazonJobs(cfg: { keywords?: string[] }, company: string): Promise<Job[]> {
  const keywords = cfg.keywords?.length ? cfg.keywords : ["account executive", "enterprise", "strategic"]
  const all: Record<string, Job> = {}

  for (const kw of keywords) {
    try {
      const url = `https://www.amazon.jobs/en/search.json?result_limit=200&offset=0&normalized_country_code=US&keywords=${encodeURIComponent(
        kw,
      )}`
      const res = await fetch(url, { headers: { accept: "application/json" } })
      if (!res.ok) continue
      const data = (await res.json()) as any
      const jobs: any[] = data?.jobs || data?.search_results || []

      for (const j of jobs) {
        const id: string = String(
          j.id || j.job_id || j.jobId || j.slug || j.job_path || j.url || `${j.title}-${j.location}`,
        )
        const title: string = j.title || j.job_title || ""
        const city = j.city || j.normalized_city || ""
        const state = j.state || j.normalized_state || ""
        const country = j.country || j.normalized_country || ""
        const location = [city, state || country].filter(Boolean).join(", ") || j.location || ""
        const path: string = j.job_path || j.job_url || j.url || ""
        const url = path
          ? path.startsWith("http")
            ? path
            : `https://www.amazon.jobs${path}`
          : "https://www.amazon.jobs"
        const posted = j.posted_date || j.posted_date_time || j.updated_time || j.posting_date || j.posted_at
        const createdAt = posted ? new Date(posted).toISOString() : new Date().toISOString()

        all[id] = {
          id,
          title,
          company,
          location,
          url,
          department: undefined,
          createdAt,
          source: "amazon",
        }
      }
    } catch {
      continue
    }
  }

  return Object.values(all)
}

async function fetchAshby(slug: string, company: string): Promise<Job[]> {
  const endpoints = [
    `https://jobs.ashbyhq.com/api/jobPosting?organizationSlug=${encodeURIComponent(slug)}`,
    `https://jobs.ashbyhq.com/api/organization/${encodeURIComponent(slug)}/job-postings`,
    `https://jobs.ashbyhq.com/api/organizations/${encodeURIComponent(slug)}/jobs`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } })
      if (!res.ok) continue
      const data = (await res.json()) as any

      const items: any[] = data?.jobPostings || data?.jobs || (Array.isArray(data) ? data : []) || []

      if (!Array.isArray(items) || items.length === 0) continue

      return items.map((j: any) => {
        const id: string = String(j.id || j.slug || j.jobId || j.uniqueId || j.externalId || j.shortUrl || j.url)
        const title: string = j.title || j.jobTitle || j.text || ""
        const location: string =
          j.location ||
          j.locationName ||
          j.offices?.map((o: any) => [o.city, o.region, o.country].filter(Boolean).join(", ")).join(" • ") ||
          j.locations
            ?.map((l: any) => l.name || l.location || "")
            .filter(Boolean)
            .join(" • ") ||
          ""
        const urlPath: string = j.shortUrl || j.hostedUrl || j.url || ""
        const urlFinal = urlPath
          ? urlPath.startsWith("http")
            ? urlPath
            : `https://jobs.ashbyhq.com/${slug}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`
          : `https://jobs.ashbyhq.com/${slug}`

        const posted = j.publishedAt || j.postedAt || j.updatedAt || j.createdAt
        const createdAt = posted ? new Date(posted).toISOString() : new Date().toISOString()

        return {
          id,
          title,
          company,
          location,
          url: urlFinal,
          department: j.department || j.team || undefined,
          createdAt,
          source: "ashby" as const,
        } satisfies Job
      })
    } catch {
      continue
    }
  }
  return []
}

async function fetchTeamtailor(slug: string, company: string): Promise<Job[]> {
  const endpoints = [`https://${slug}.teamtailor.com/api/jobs`, `https://${slug}.teamtailor.com/api/v1/jobs`]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } })
      if (!res.ok) continue
      const data = (await res.json()) as any

      const jobs1: any[] = Array.isArray(data?.jobs) ? data.jobs : []
      const jobs2: any[] = Array.isArray(data?.data) ? data.data : []

      if (jobs1.length > 0) {
        return jobs1.map((j) => {
          const id = String(j.id)
          const title = j.title || j.name || ""
          const loc =
            j.location ||
            [j?.city, j?.state, j?.country].filter(Boolean).join(", ") ||
            [j?.location?.city, j?.location?.country].filter(Boolean).join(", ") ||
            ""
          const href = j.url || j.hostedUrl || j.career_url || j.link || ""
          const createdAt = j.published_at || j.created_at || j.updated_at || new Date().toISOString()
          return {
            id,
            title,
            company,
            location: String(loc || ""),
            url: href || `https://${slug}.teamtailor.com`,
            department: j.team || j.department || undefined,
            createdAt: new Date(createdAt).toISOString(),
            source: "teamtailor" as const,
          } satisfies Job
        })
      }

      if (jobs2.length > 0) {
        return jobs2.map((entry) => {
          const id = String(entry.id)
          const a = entry.attributes || {}
          const title = a.title || a.name || ""
          const loc = a.location || [a?.city, a?.state, a?.country].filter(Boolean).join(", ") || ""
          const href = entry?.links?.self || a.url || ""
          const createdAt = a.published_at || a.created_at || a.updated_at || new Date().toISOString()
          return {
            id,
            title,
            company,
            location: String(loc || ""),
            url: href || `https://${slug}.teamtailor.com`,
            department: a.team || a.department || undefined,
            createdAt: new Date(createdAt).toISOString(),
            source: "teamtailor" as const,
          } satisfies Job
        })
      }
    } catch {
      continue
    }
  }

  return []
}

async function fetchSmartRecruiters(companyId: string, company: string): Promise<Job[]> {
  try {
    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companyId)}/postings?limit=200`
    const res = await fetch(url, { headers: { accept: "application/json" } })
    if (!res.ok) return []
    const data = (await res.json()) as any
    const content: any[] = data?.content || data?.result || data?.data || []
    if (!Array.isArray(content)) return []

    return content.map((j) => {
      const id = String(j.id || j.uuid || j.identifier)
      const title = j.name || j.title || ""
      const loc = j.location
        ? [j.location.city, j.location.region, j.location.country].filter(Boolean).join(", ")
        : j.locationText || ""
      const url =
        j.applyUrl ||
        j.jobAd?.sections?.company?.url ||
        (id
          ? `https://jobs.smartrecruiters.com/${companyId}/${id}`
          : `https://careers.smartrecruiters.com/${companyId}`)
      const posted = j.releasedDate || j.createdOn || j.created || j.updatedOn
      const createdAt = posted ? new Date(posted).toISOString() : new Date().toISOString()
      return {
        id,
        title,
        company,
        location: loc,
        url,
        department: j.department || j.function || undefined,
        createdAt,
        source: "smartrecruiters" as const,
      } satisfies Job
    })
  } catch {
    return []
  }
}

async function fetchICIMS(slug: string, company: string): Promise<Job[]> {
  // Best-effort: iCIMS endpoints vary; try a few known patterns. Many tenants block or return HTML.
  const endpoints = [
    // Some tenants expose a JSON search API under /search/api/jobs
    `https://${slug}.icims.com/search/api/jobs?pr=0&in_iframe=1&mobile=false`,
    // Some expose a jobs API (less common)
    `https://${slug}.icims.com/api/jobs`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } })
      if (!res.ok) continue
      const data = await res.json()

      // Try to find an array of jobs in a few likely places
      const arr: any[] =
        (Array.isArray((data as any).jobs) && (data as any).jobs) ||
        (Array.isArray((data as any).items) && (data as any).items) ||
        (Array.isArray(data) ? (data as any) : []) ||
        []

      if (!Array.isArray(arr) || arr.length === 0) continue

      return arr.map((j: any) => {
        const id = String(j.id || j.jobId || j.identifier || j.reqId || j.url || Math.random())
        const title = j.title || j.jobTitle || j.name || "Job"
        const location =
          j.location ||
          j.locationName ||
          j.locationText ||
          j.city ||
          [j?.city, j?.state, j?.country].filter(Boolean).join(", ") ||
          ""
        const urlField = j.url || j.hostedUrl || j.applyUrl || j.link || j.canonicalUrl || ""
        const href = urlField ? urlField : `https://${slug}.icims.com/jobs/search?ss=1`
        const posted = j.postedDate || j.posted || j.updatedAt || j.createdAt
        const createdAt = posted ? new Date(posted).toISOString() : new Date().toISOString()

        return {
          id,
          title,
          company,
          location,
          url: href,
          department: j.department || j.team || undefined,
          createdAt,
          source: "icims" as const,
        } satisfies Job
      })
    } catch {
      continue
    }
  }

  return []
}

/**
 * Filters and helpers
 */
function clampInt(value: string | null, min: number, max: number, fallback: number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

function dedupeArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

// Location logic

function isRemoteAny(raw: string): boolean {
  const l = raw.toLowerCase()
  return (
    /\bremote\b/.test(l) ||
    /\banywhere\b/.test(l) ||
    /\bglobal\b/.test(l) ||
    /\bdistributed\b/.test(l) ||
    /\bwork from home\b/.test(l) ||
    /\btelecommute\b/.test(l)
  )
}

function mentionsUS(raw: string): boolean {
  const l = raw.toLowerCase()
  if (/\bunited states\b/.test(l)) return true
  if (/\bu\.?s\.?a?\.?\b/.test(l)) return true // US, U.S., USA
  if (/\bus[-\s]?only\b/.test(l)) return true
  if (/\bwithin the us\b/.test(l)) return true
  return false
}

function mentionsNorthAmerica(raw: string): boolean {
  return /\bnorth america\b/i.test(raw)
}

// Examples: "US or Canada", "US/Canada", "United States and Canada", "USA & Canada"
function mentionsUSOrCanada(raw: string): boolean {
  const l = raw.toLowerCase()
  if (/\bus\s*\/\s*canada\b/.test(l)) return true
  if (/\busa\s*\/\s*canada\b/.test(l)) return true
  if (/\bunited states\b.*\bcanada\b/.test(l)) return true
  if (/\bcanada\b.*\bunited states\b/.test(l)) return true
  if (/\bus\b.*\bcanada\b/.test(l)) return true
  if (/\bcanada\b.*\bus\b/.test(l)) return true
  if (/\busa\b.*\bcanada\b/.test(l)) return true
  if (/\bcanada\b.*\busa\b/.test(l)) return true
  if (/\b(us|usa)\s*(and|&|or)\s*canada\b/.test(l)) return true
  return false
}

function containsUSTimezone(raw: string): boolean {
  const l = raw.toLowerCase()
  return (
    /\b(et|est|eastern time)\b/.test(l) ||
    /\b(ct|cst|central time)\b/.test(l) ||
    /\b(mt|mst|mountain time)\b/.test(l) ||
    /\b(pt|pst|pacific time)\b/.test(l)
  )
}

function isUSLocation(raw: string): boolean {
  const l = raw.toLowerCase()

  if (/\bunited states\b/.test(l) || /\bu\.?s\.?a?\.?\b/.test(l)) return true
  if (/\bwashington[, ]?d\.?c\.?\b/.test(l)) return true

  const STATE_NAMES = [
    "alabama",
    "alaska",
    "arizona",
    "arkansas",
    "california",
    "colorado",
    "connecticut",
    "delaware",
    "florida",
    "georgia",
    "hawaii",
    "idaho",
    "illinois",
    "indiana",
    "iowa",
    "kansas",
    "kentucky",
    "louisiana",
    "maine",
    "maryland",
    "massachusetts",
    "michigan",
    "minnesota",
    "mississippi",
    "missouri",
    "montana",
    "nebraska",
    "nevada",
    "new hampshire",
    "new jersey",
    "new mexico",
    "new york",
    "north carolina",
    "north dakota",
    "ohio",
    "oklahoma",
    "oregon",
    "pennsylvania",
    "rhode island",
    "south carolina",
    "south dakota",
    "tennessee",
    "texas",
    "utah",
    "vermont",
    "virginia",
    "washington",
    "west virginia",
    "wisconsin",
    "wyoming",
    "district of columbia",
  ]
  if (STATE_NAMES.some((n) => l.includes(n))) return true

  const u = raw.toUpperCase()
  const STATE_ABBR = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "DC",
  ]
  for (const ab of STATE_ABBR) {
    const re = new RegExp(`(^|[\\s,\\/\$\\-\$$])${ab}([\\s,\\/\$\\-\$$]|$)`)
    if (re.test(u)) return true
  }

  return false
}

function containsNonUSKeywords(raw: string): boolean {
  const l = raw.toLowerCase()
  const TERMS = [
    "bangalore",
    "bengaluru",
    "india",
    "brazil",
    "canada",
    "mexico",
    "colombia",
    "argentina",
    "chile",
    "peru",
    "uruguay",
    "europe",
    "emea",
    "latam",
    "apac",
    "asia",
    "africa",
    "middle east",
    "mena",
    "united kingdom",
    "uk",
    "england",
    "scotland",
    "wales",
    "ireland",
    "london",
    "paris",
    "france",
    "germany",
    "spain",
    "portugal",
    "italy",
    "netherlands",
    "belgium",
    "austria",
    "switzerland",
    "poland",
    "czech",
    "slovakia",
    "slovenia",
    "croatia",
    "serbia",
    "romania",
    "bulgaria",
    "greece",
    "turkey",
    "israel",
    "uae",
    "dubai",
    "saudi",
    "egypt",
    "south africa",
    "nigeria",
    "kenya",
    "ghana",
    "morocco",
    "algeria",
    "tunisia",
    "ethiopia",
    "russia",
    "ukraine",
    "belarus",
    "georgia",
    "armenia",
    "azerbaijan",
    "pakistan",
    "bangladesh",
    "sri lanka",
    "nepal",
    "bhutan",
    "philippines",
    "indonesia",
    "malaysia",
    "singapore",
    "thailand",
    "vietnam",
    "cambodia",
    "laos",
    "hong kong",
    "china",
    "taiwan",
    "japan",
    "korea",
    "south korea",
    "australia",
    "new zealand",
    "americas",
    "global",
    "anywhere",
    "worldwide",
    "international",
    "north america", // handle separately when NA allowed
  ]
  return TERMS.some((t) => l.includes(t))
}

function hasUSHintsFromTitleOrUrl(j: Job): boolean {
  const title = (j.title || "").toLowerCase()
  const url = (j.url || "").toLowerCase()
  if (/\b(us|u\.s\.a?|united states)\b/.test(title)) return true
  if (url.includes("/en-us") || url.includes("/us/") || url.includes("/us-en") || url.includes("united-states"))
    return true
  return false
}

function passesLocationGate(j: Job, opts: { allowNAremote: boolean }): boolean {
  const raw = j.location ?? ""
  const l = raw.trim()
  const isRemote = isRemoteAny(l)

  // Accept explicit US locations always
  if (l && isUSLocation(l)) return true

  // Remote logic
  if (isRemote) {
    if (opts.allowNAremote) {
      if (mentionsNorthAmerica(l)) return true
      if (mentionsUSOrCanada(l)) return true
    }
    // Strict US-remote acceptance
    if (containsNonUSKeywords(l)) {
      // If NA is allowed and it's only Canada mention, allow if US or Canada is implied
      if (opts.allowNAremote && /canada/i.test(l) && mentionsUSOrCanada(l)) {
        return true
      }
      return false
    }
    if (mentionsUS(l)) return true
    if (isUSLocation(l)) return true
    if (containsUSTimezone(l)) return true
    // If blank location but US hints appear in title or URL, optionally accept
    if (!l && hasUSHintsFromTitleOrUrl(j)) return true
    return false
  }

  // Non-remote with blank location: optionally accept if we have US hints and NA allowed
  if (!l && opts.allowNAremote && hasUSHintsFromTitleOrUrl(j)) return true

  return false
}
