import { NextResponse } from "next/server"

export async function GET() {
  const results: any[] = []

  // Test Snowflake variations
  const snowflakeTokens = ["snowflake", "snowflakecomputing", "snowflakeinc", "snowflakedb"]
  for (const token of snowflakeTokens) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`
      const res = await fetch(url, { headers: { accept: "application/json" } })
      const data = res.ok ? await res.json() : null
      results.push({
        company: "Snowflake",
        token,
        status: res.status,
        working: res.ok,
        jobCount: data?.jobs?.length || 0,
      })
    } catch (e: any) {
      results.push({
        company: "Snowflake",
        token,
        status: "error",
        working: false,
        error: e.message,
      })
    }
  }

  // Test Atlassian variations
  const atlassianTokens = ["atlassian", "atlassiancorp", "atlassianteam"]
  for (const token of atlassianTokens) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`
      const res = await fetch(url, { headers: { accept: "application/json" } })
      const data = res.ok ? await res.json() : null
      results.push({
        company: "Atlassian",
        token,
        status: res.status,
        working: res.ok,
        jobCount: data?.jobs?.length || 0,
      })
    } catch (e: any) {
      results.push({
        company: "Atlassian",
        token,
        status: "error",
        working: false,
        error: e.message,
      })
    }
  }

  return NextResponse.json({
    results,
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      working: results.filter((r) => r.working).length,
      failed: results.filter((r) => !r.working).length,
    },
  })
}
