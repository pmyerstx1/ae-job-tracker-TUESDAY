const POSITIVE = [
  "enterprise",
  "strategic",
  "majors",
  "major accounts",
  "major account",
  "named",
  "named accounts",
  "key accounts",
  "global accounts",
  "large enterprise",
  "select accounts",
  "strategic accounts",
  "global account",
]

const AE_TERMS = [
  "account executive",
  "ae",
  "acct exec",
  "sales executive",
  "account manager",
  "account director",
  "client executive",
  "sales representative",
  "sales rep",
]

// Roles we always exclude (regardless of positives)
// Keep this focused on seniority/contract and SDR/BDR
const NEGATIVE = [
  "smb",
  "mid-market",
  "mid market",
  "commercial",
  "mm ",
  "sdr",
  "bdr",
  "intern",
  "contract",
  "temporary",
  "contractor",
  "assistant",
  "co-op",
  "coop",
  "unpaid",
]

export function filterIsEnterpriseAE(title: string): boolean {
  const t = norm(title)

  if (NEGATIVE.some((n) => t.includes(n))) return false

  const hasPos = POSITIVE.some((p) => t.includes(p))
  if (!hasPos) return false

  // Ensure AE terms appear as a word or known abbreviation; allow "account manager/director" when combined with Enterprise/Strategic context above.
  const hasAe = AE_TERMS.some((k) => {
    if (k === "ae") return /\bae\b/.test(t)
    return t.includes(k)
  })

  return hasAe
}

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}
