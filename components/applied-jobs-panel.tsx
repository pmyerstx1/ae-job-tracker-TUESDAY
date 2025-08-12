"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, X } from "lucide-react"
import type { AppliedJob } from "@/hooks/use-applied-jobs"
import { formatRelative } from "@/lib/utils"

interface AppliedJobsPanelProps {
  appliedJobs: AppliedJob[]
  onRemove: (source: string, id: string) => void
  isLoaded: boolean
}

export function AppliedJobsPanel({ appliedJobs, onRemove, isLoaded }: AppliedJobsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isLoaded) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading applied jobs...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (appliedJobs.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Applied Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You haven't marked any jobs as applied yet. Click the "Mark as Applied" button on a job card to track your
            applications.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Applied Jobs <Badge variant="secondary">{appliedJobs.length}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid gap-3">
            {appliedJobs.map((job) => (
              <div key={`${job.source}-${job.id}`} className="flex items-center justify-between border rounded-md p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline truncate"
                    >
                      {job.title}
                    </a>
                    <Badge variant="outline" className="capitalize">
                      {job.source}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3">
                    <span>{job.company}</span>
                    <span>Applied {formatRelative(job.appliedAt)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onRemove(job.source, job.id)}
                  aria-label={`Remove ${job.title} from applied jobs`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
