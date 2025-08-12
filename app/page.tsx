"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppliedJobs } from "@/hooks/use-applied-jobs"
import { AppliedJobsPanel } from "@/components/applied-jobs-panel"

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

const DEFAULT_DAYS = "7"

export default function Component() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState<string>(DEFAULT_DAYS)
  const [q, setQ] = useState("")
  const [usOnlyRemoteUS, setUsOnlyRemoteUS] = useState(true)
  const [allowNorthAmericaRemote, setAllowNorthAmericaRemote] = useState(false)
  const [groupByCompany, setGroupByCompany] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Coverage panel
  const [showCoverage, setShowCoverage] = useState(false)
  const [coverage, setCoverage] = useState<CoverageRow[]>([])
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [coverageError, setCoverageError] = useState<string | null>(null)

  // Applied jobs tracking
  const {
    markAsApplied,
    removeApplied,
    isApplied,
    getAppliedJobs,
    appliedJobsCount,
    isLoaded: appliedJobsLoaded,
  } = useAppliedJobs()
  const [showAppliedOnly, setShowAppliedOnly] = useState(false)

  const jobsQueryParams = useMemo(() => {
    return (
      `?days=${encodeURIComponent(days)}` +
      (usOnlyRemoteUS ? "&us_or_remote_us=1" : "") +
      (allowNorthAmericaRemote ? "&na_remote_ok=1" : "")
    )
  }, [days, usOnlyRemoteUS, allowNorthAmericaRemote])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/jobs${jobsQueryParams}`)
      if (!res.ok) throw new Error(`Failed to load jobs: ${res.status}`)
      const data = (await res.json()) as Job[]
      setJobs(data)
      setExpandedGroups([])
    } catch (e: any) {
      setError(e?.message ?? "Failed to load jobs")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  async function loadCoverage() {
    try {
      setCoverageLoading(true)
      setCoverageError(null)
      const res = await fetch(`/api/jobs/coverage${jobsQueryParams}`)
      if (!res.ok) throw new Error(`Failed to load coverage: ${res.status}`)
      const data = (await res.json()) as { rows: CoverageRow[]; generatedAt: string }
      setCoverage(data.rows)
    } catch (e: any) {
      setCoverageError(e?.message ?? "Failed to load coverage")
      setCoverage([])
    } finally {
      setCoverageLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, usOnlyRemoteUS, allowNorthAmericaRemote])

  useEffect(() => {
    if (showCoverage) {
      loadCoverage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCoverage, days, usOnlyRemoteUS, allowNorthAmericaRemote])

  const filtered = useMemo(() => {
    const qNorm = q.trim().toLowerCase()
    let results = jobs

    // Apply search filter
    if (qNorm) {
      results = results.filter((j) => {
        return (
          j.title.toLowerCase().includes(qNorm) ||
          j.company.toLowerCase().includes(qNorm) ||
          (j.location ?? "").toLowerCase().includes(qNorm) ||
          (j.department ?? "").toLowerCase().includes(qNorm)
        )
      })
    }

    // Apply applied-only filter if enabled
    if (showAppliedOnly) {
      results = results.filter((j) => isApplied(j.source, j.id))
    }

    return results
  }, [jobs, q, showAppliedOnly, isApplied])

  const grouped = useMemo(() => {
    const map = new Map<string, Job[]>()
    for (const j of filtered) {
      const key = normalizeCompany(j.company)
      const arr = map.get(key)
      if (arr) {
        arr.push(j)
      } else {
        map.set(key, [j])
      }
    }
    const groups = Array.from(map.entries()).map(([company, items]) => {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return { company, jobs: items }
    })
    groups.sort((a, b) => a.company.localeCompare(b.company))
    return groups
  }, [filtered])

  function expandAll() {
    setExpandedGroups(grouped.map((g) => g.company))
  }
  function collapseAll() {
    setExpandedGroups([])
  }

  return (
    <main className="container mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Enterprise & Strategic AE Jobs</h1>
        <p className="text-muted-foreground mt-1">
          Fresh openings filtered by title from selected company career pages. Default view shows US locations and
          Remote (US-only) in the last 7 days.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end mb-4">
        <div className="space-y-2">
          <Label htmlFor="q">Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="q"
              placeholder="Filter by company, location, or department"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Timeframe</Label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger>
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="3">Last 3 days</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="365">All recent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button
              variant={usOnlyRemoteUS ? "default" : "outline"}
              onClick={() => setUsOnlyRemoteUS((v) => !v)}
              className={cn("w-full")}
              aria-pressed={usOnlyRemoteUS}
            >
              {usOnlyRemoteUS ? "US + Remote (US-only): ON" : "US + Remote (US-only): OFF"}
            </Button>
            <Button variant="outline" onClick={load} className="w-28 bg-transparent">
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="na-remote"
              checked={allowNorthAmericaRemote}
              onCheckedChange={setAllowNorthAmericaRemote}
              aria-label="Include North America remote (no explicit US)"
            />
            <Label htmlFor="na-remote" className="text-sm">
              Include North America remote (no explicit US)
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="group-by-company"
              checked={groupByCompany}
              onCheckedChange={(v) => {
                setGroupByCompany(v)
                setExpandedGroups([])
              }}
              aria-label="Group results by company"
            />
            <Label htmlFor="group-by-company" className="text-sm">
              Group by company
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="coverage"
              checked={showCoverage}
              onCheckedChange={setShowCoverage}
              aria-label="Show coverage panel"
            />
            <Label htmlFor="coverage" className="text-sm">
              Show coverage panel
            </Label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Switch
          id="applied-only"
          checked={showAppliedOnly}
          onCheckedChange={setShowAppliedOnly}
          aria-label="Show only jobs I've applied to"
        />
        <Label htmlFor="applied-only" className="text-sm">
          Show only jobs I've applied to {appliedJobsCount > 0 && `(${appliedJobsCount})`}
        </Label>
      </div>

      {/* Applied Jobs Panel */}
      <AppliedJobsPanel appliedJobs={getAppliedJobs()} onRemove={removeApplied} isLoaded={appliedJobsLoaded} />

      {showCoverage && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Coverage</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadCoverage}>
                  {coverageLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing
                    </span>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {coverageError ? (
              <div className="text-sm text-red-600">{coverageError}</div>
            ) : coverageLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading coverage…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption className="text-xs">
                    Per-company fetch status, fetched postings, and matched AE roles after current filters.
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Fetched</TableHead>
                      <TableHead className="text-right">Matched</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverage.map((row) => (
                      <TableRow key={`${row.provider}-${row.company}`}>
                        <TableCell className="font-medium">{row.company}</TableCell>
                        <TableCell className="capitalize">{row.provider}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.fetched}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className={cn(row.matched > 0 ? "text-foreground" : "text-muted-foreground")}>
                            {row.matched}
                          </span>
                        </TableCell>
                        <TableCell>
                          {row.ok ? <Badge variant="secondary">OK</Badge> : <Badge variant="outline">Error</Badge>}
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate" title={row.error ?? ""}>
                          {row.error ?? ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading jobs…</span>
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : groupByCompany ? (
        grouped.length === 0 ? (
          <div className="text-sm text-muted-foreground">No jobs found. Try expanding your timeframe.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand all
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse all
              </Button>
            </div>
            <Accordion
              type="multiple"
              value={expandedGroups}
              onValueChange={(v) => setExpandedGroups(Array.isArray(v) ? v : [])}
              className="w-full"
            >
              {grouped.map((g) => (
                <AccordionItem key={g.company} value={g.company}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{g.company}</span>
                      <Badge variant="secondary">{g.jobs.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3">
                      {g.jobs.map((job) => (
                        <Card key={`${job.source}-${job.id}`}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base md:text-lg flex flex-wrap items-center gap-2">
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                aria-label={`Open ${job.title} at ${job.company}`}
                              >
                                {job.title}
                              </a>
                              {job.department ? <Badge variant="outline">{job.department}</Badge> : null}
                              <Badge variant="outline" className="capitalize">
                                {job.source}
                              </Badge>
                              {isApplied(job.source, job.id) && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                >
                                  Applied
                                </Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-3">
                              {job.location ? <span>{job.location}</span> : <span>Location not listed</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <time dateTime={job.createdAt} className="whitespace-nowrap">
                                Posted {formatRelative(job.createdAt)}
                              </time>
                              {isApplied(job.source, job.id) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeApplied(job.source, job.id)}
                                  className="ml-2"
                                >
                                  Remove Applied
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => markAsApplied(job)} className="ml-2">
                                  Mark as Applied
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No jobs found. Try expanding your timeframe.</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((job) => (
            <Card key={`${job.source}-${job.id}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex flex-wrap items-center gap-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    aria-label={`Open ${job.title} at ${job.company}`}
                  >
                    {job.title}
                  </a>
                  <Badge variant="secondary">{job.company}</Badge>
                  {job.department ? <Badge variant="outline">{job.department}</Badge> : null}
                  <Badge variant="outline" className="capitalize">
                    {job.source}
                  </Badge>
                  {isApplied(job.source, job.id) && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Applied
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  {job.location ? <span>{job.location}</span> : <span>Location not listed</span>}
                </div>
                <div className="flex items-center gap-2">
                  <time dateTime={job.createdAt} className="whitespace-nowrap">
                    Posted {formatRelative(job.createdAt)}
                  </time>
                  {isApplied(job.source, job.id) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeApplied(job.source, job.id)}
                      className="ml-2"
                    >
                      Remove Applied
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => markAsApplied(job)} className="ml-2">
                      Mark as Applied
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <footer className="mt-8 text-xs text-muted-foreground">
        Tip: Add a database and Vercel Cron to snapshot daily results and power email/Slack digests.
      </footer>
    </main>
  )
}

function normalizeCompany(name: string) {
  return name.replace(/\s+/g, " ").trim()
}

function formatRelative(iso: string) {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
