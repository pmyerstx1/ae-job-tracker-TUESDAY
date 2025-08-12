import { NextResponse } from "next/server"
import { companies } from "@/lib/companies"
import { filterIsEnterpriseAE } from "@/lib/filter"

// Mirror Job type from jobs route
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

type CoverageRow = {
  company: string
  provider: string
  ok: boolean
  fetched: number
  matched: number
  error?: string
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const days = clampInt(searchParams.get("days"), 1, 365, 7)
  const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000
  const onlyRemote = searchParams.get("remote") === "1"
  const usOrRemoteUS = searchParams.get("us_or_remote_us") === "1"
  const allowNAremote = searchParams.get("na_remote_ok") === "1"

  const rows: CoverageRow[] = []

  await Promise.all(
    companies.map(async (c) => {
      let fetched: Job[] = []
      let ok = true
      let error: string | undefined

      try {
        switch (c.provider) {
          case "greenhouse": {
            const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(c.boardToken)}/jobs?content=true`
            const res = await fetch(url, { headers: { accept: "application/json" } })
            if (!res.ok) {
              ok = false
              error = `HTTP ${res.status}`
              fetched = []
            } else {
              const data = (await res.json()) as any
              fetched = (data.jobs ?? []).map((j: any) => ({
                id: String(j.id),
                title: j.title,
                company: c.name,
                location: j.location?.name,
                url: j.absolute_url,
                department: j.departments && j.departments.length ? j.departments[0]?.name : undefined,
                createdAt: j.created_at || j.updated_at || new Date().toISOString(),
                source: "greenhouse",
              }))
            }
            break
          }
          case "lever": {
            const url = `https://api.lever.co/v0/postings/${encodeURIComponent(c.site)}?mode=json`
            const res = await fetch(url, { headers: { accept: "application/json" } })
            if (!res.ok) {
              ok = false
              error = `HTTP ${res.status}`
              fetched = []
            } else {
              const data = (await res.json()) as any[]
              fetched = data.map((j: any) => ({
                id: j.id,
                title: j.text,
                company: c.name,
                location: j.categories?.location,
                url: j.hostedUrl,
                department: j.categories?.team,
                createdAt: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
                source: "lever",
              }))
            }
            break
          }
          case "workday": {
            const region = c.region || "wd1"
            const tenant = c.tenant
            const sites = dedupeArray(
              [c.site, ...(c.siteCandidates || []), "jobs", "careers", tenant].filter(Boolean) as string[],
            )
            let found: Job[] = []
            let lastErr: string | undefined
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
                if (!res.ok) {
                  lastErr = `HTTP ${res.status}`
                  continue
                }
                const data = (await res.json()) as any
                const postings: any[] = data?.jobPostings || data?.results || []
                if (!Array.isArray(postings) || postings.length === 0) continue
                found = postings.map((p) => {
                  const title: string = p.title || p.bulletFields?.title || "Job"
                  const externalPath: string =
                    p.externalPath || p.externalUrlPath || p.externalURL || p.externalUrl || p.uri || ""
                  const locationsText: string =
                    p.locationsText ||
                    p.locations?.map((l: any) => [l.city, l.state, l.country].filter(Boolean).join(", ")).join(" • ") ||
                    p.location ||
                    ""
                  const posted =
                    p.postedOn || p.postedDate || p.publicationDate || p.latestUpdateDateTime || p.postedDateTime
                  const createdAt = posted ? new Date(posted).toISOString() : new Date().toISOString()
                  const url = externalPath
                    ? `https://${tenant}.${region}.myworkdayjobs.com/en-US/${site}${
                        externalPath.startsWith("/") ? externalPath : `/${externalPath}`
                      }`
                    : `https://${tenant}.${region}.myworkdayjobs.com/en-US/${site}`
                  return {
                    id: externalPath || `${title}-${url}`,
                    title,
                    company: c.name,
                    location: locationsText,
                    url,
                    department: undefined,
                    createdAt,
                    source: "workday" as const,
                  }
                })
                break
              } catch (e: any) {
                lastErr = e?.message || "Fetch error"
                continue
              }
            }
            fetched = found
            ok = found.length > 0
            error = ok ? undefined : (error ?? lastErr ?? "No postings found")
            break
          }
          case "amazon": {
            try {
              const kws = c.keywords?.length ? c.keywords : ["account executive", "enterprise", "strategic"]
              const all: Record<string, Job> = {}
              for (const kw of kws) {
                const url = `https://www.amazon.jobs/en/search.json?result_limit=200&offset=0&normalized_country_code=US&keywords=${encodeURIComponent(
                  kw,
                )}`
                const res = await fetch(url, { headers: { accept: "application/json" } })
                if (!res.ok) {
                  ok = false
                  error = `HTTP ${res.status}`
                  continue
                }
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
                    company: c.name,
                    location,
                    url,
                    department: undefined,
                    createdAt,
                    source: "amazon",
                  }
                }
              }
              fetched = Object.values(all)
              ok = true
            } catch (e: any) {
              ok = false
              error = e?.message || "Fetch error"
              fetched = []
            }
            break
          }
          case "ashby": {
            try {
              const url = `https://jobs.ashbyhq.com/api/jobPosting?organizationSlug=${encodeURIComponent(c.slug)}`
              const res = await fetch(url, { headers: { accept: "application/json" } })
              if (!res.ok) {
                ok = false
                error = `HTTP ${res.status}`
                fetched = []
              } else {
                const data = (await res.json()) as any
                const items: any[] = data?.jobPostings || []
                fetched = items.map((j: any) => ({
                  id: String(j.id || j.slug || j.jobId || j.uniqueId || j.externalId || j.shortUrl || j.url),
                  title: j.title || j.jobTitle || j.text || "",
                  company: c.name,
                  location:
                    j.location ||
                    j.locationName ||
                    j.offices?.map((o: any) => [o.city, o.region, o.country].filter(Boolean).join(", ")).join(" • ") ||
                    j.locations
                      ?.map((l: any) => l.name || l.location || "")
                      .filter(Boolean)
                      .join(" • ") ||
                    "",
                  url:
                    (j.shortUrl && String(j.shortUrl).startsWith("http") ? j.shortUrl : undefined) ||
                    `https://jobs.ashbyhq.com/${c.slug}`,
                  department: j.department || j.team || undefined,
                  createdAt: new Date(
                    j.publishedAt || j.postedAt || j.updatedAt || j.createdAt || Date.now(),
                  ).toISOString(),
                  source: "ashby",
                }))
              }
            } catch (e: any) {
              ok = false
              error = e?.message || "Fetch error"
              fetched = []
            }
            break
          }
          case "teamtailor": {
            try {
              const url = `https://${c.slug}.teamtailor.com/api/jobs`
              const res = await fetch(url, { headers: { accept: "application/json" } })
              if (!res.ok) {
                ok = false
                error = `HTTP ${res.status}`
                fetched = []
              } else {
                const data = (await res.json()) as any
                const jobs1: any[] = Array.isArray(data?.jobs) ? data.jobs : []
                fetched = jobs1.map((j) => ({
                  id: String(j.id),
                  title: j.title || j.name || "",
                  company: c.name,
                  location:
                    j.location ||
                    [j?.city, j?.state, j?.country].filter(Boolean).join(", ") ||
                    [j?.location?.city, j?.location?.country].filter(Boolean).join(", ") ||
                    "",
                  url: j.url || `https://${c.slug}.teamtailor.com`,
                  department: j.team || j.department || undefined,
                  createdAt: new Date(j.published_at || j.created_at || j.updated_at || Date.now()).toISOString(),
                  source: "teamtailor",
                }))
              }
            } catch (e: any) {
              ok = false
              error = e?.message || "Fetch error"
              fetched = []
            }
            break
          }
          case "smartrecruiters": {
            try {
              const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(c.companyId)}/postings?limit=200`
              const res = await fetch(url, { headers: { accept: "application/json" } })
              if (!res.ok) {
                ok = false
                error = `HTTP ${res.status}`
                fetched = []
              } else {
                const data = (await res.json()) as any
                const content: any[] = data?.content || []
                fetched = content.map((j) => ({
                  id: String(j.id || j.uuid || j.identifier),
                  title: j.name || j.title || "",
                  company: c.name,
                  location: j.location
                    ? [j.location.city, j.location.region, j.location.country].filter(Boolean).join(", ")
                    : "",
                  url:
                    j.applyUrl ||
                    (j.id
                      ? `https://jobs.smartrecruiters.com/${c.companyId}/${j.id}`
                      : `https://careers.smartrecruiters.com/${c.companyId}`),
                  department: j.department || j.function || undefined,
                  createdAt: new Date(j.releasedDate || j.createdOn || Date.now()).toISOString(),
                  source: "smartrecruiters",
                }))
              }
            } catch (e: any) {
              ok = false
              error = e?.message || "Fetch error"
              fetched = []
            }
            break
          }
          case "icims": {
            try {
              const url = `https://${c.slug}.icims.com/search/api/jobs?pr=0&in_iframe=1&mobile=false`
              const res = await fetch(url, { headers: { accept: "application/json" } })
              if (!res.ok) {
                ok = false
                error = `HTTP ${res.status}`
                fetched = []
              } else {
                const data = await res.json()
                const arr: any[] =
                  (Array.isArray((data as any).jobs) && (data as any).jobs) ||
                  (Array.isArray((data as any).items) && (data as any).items) ||
                  (Array.isArray(data) ? (data as any) : []) ||
                  []
                fetched = arr.map((j: any) => ({
                  id: String(j.id || j.jobId || j.identifier || j.reqId || Math.random()),
                  title: j.title || j.jobTitle || j.name || "Job",
                  company: c.name,
                  location:
                    j.location ||
                    j.locationName ||
                    j.locationText ||
                    j.city ||
                    [j?.city, j?.state, j?.country].filter(Boolean).join(", ") ||
                    "",
                  url: j.url || j.hostedUrl || `https://${c.slug}.icims.com/jobs/search?ss=1`,
                  department: j.department || j.team || undefined,
                  createdAt: new Date(j.postedDate || j.posted || Date.now()).toISOString(),
                  source: "icims",
                }))
              }
            } catch (e: any) {
              ok = false
              error = e?.message || "Fetch error"
              fetched = []
            }
            break
          }
        }
      } catch (e: any) {
        ok = false
        error = e?.message || "Fetch error"
        fetched = []
      }

      // Apply the same filters we use in the jobs endpoint to compute matched count
      const matched = fetched.filter((j) => {
        if (!filterIsEnterpriseAE(j.title)) return false
        const created = new Date(j.createdAt).getTime()
        if (isFinite(created) ? created < sinceMs : false) return false
        if (onlyRemote) return isRemoteAny(j.location ?? "")
        if (usOrRemoteUS) return passesLocationGate(j, { allowNAremote })
        return true
      }).length

      rows.push({
        company: c.name,
        provider: (c as any).provider,
        ok,
        fetched: fetched.length,
        matched,
        error,
      })
    }),
  )

  // Sort: errors last, then by matched desc
  rows.sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1
    if (b.matched !== a.matched) return b.matched - a.matched
    return a.company.localeCompare(b.company)
  })

  return NextResponse.json(
    { rows, generatedAt: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  )
}

/**
 * Helpers (duplicate minimal copies from jobs route)
 */
function clampInt(value: string | null, min: number, max: number, fallback: number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

function dedupeArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

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
  if (/\bu\.?s\.?a?\.?\b/.test(l)) return true
  if (/\bus[-\s]?only\b/.test(l)) return true
  if (/\bwithin the us\b/.test(l)) return true
  return false
}

function mentionsNorthAmerica(raw: string): boolean {
  return /\bnorth america\b/i.test(raw)
}

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

  if (l && isUSLocation(l)) return true

  if (isRemote) {
    if (opts.allowNAremote) {
      if (mentionsNorthAmerica(l)) return true
      if (mentionsUSOrCanada(l)) return true
    }
    if (containsNonUSKeywords(l)) {
      if (opts.allowNAremote && /canada/i.test(l) && mentionsUSOrCanada(l)) {
        return true
      }
      return false
    }
    if (mentionsUS(l)) return true
    if (isUSLocation(l)) return true
    if (containsUSTimezone(l)) return true
    if (!l && hasUSHintsFromTitleOrUrl(j)) return true
    return false
  }

  if (!l && opts.allowNAremote && hasUSHintsFromTitleOrUrl(j)) return true

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
    "north america",
  ]
  return TERMS.some((t) => l.includes(t))
}
