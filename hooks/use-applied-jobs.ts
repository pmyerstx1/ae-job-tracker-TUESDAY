"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "applied-jobs"

export type AppliedJob = {
  id: string
  source: string
  company: string
  title: string
  appliedAt: string
  url: string
}

export function useAppliedJobs() {
  const [appliedJobs, setAppliedJobs] = useState<Record<string, AppliedJob>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load applied jobs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setAppliedJobs(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load applied jobs from localStorage", e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever appliedJobs changes
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appliedJobs))
    } catch (e) {
      console.error("Failed to save applied jobs to localStorage", e)
    }
  }, [appliedJobs, isLoaded])

  const markAsApplied = (job: {
    id: string
    source: string
    company: string
    title: string
    url: string
  }) => {
    setAppliedJobs((prev) => ({
      ...prev,
      [`${job.source}-${job.id}`]: {
        id: job.id,
        source: job.source,
        company: job.company,
        title: job.title,
        url: job.url,
        appliedAt: new Date().toISOString(),
      },
    }))
  }

  const removeApplied = (jobSource: string, jobId: string) => {
    setAppliedJobs((prev) => {
      const newState = { ...prev }
      delete newState[`${jobSource}-${jobId}`]
      return newState
    })
  }

  const isApplied = (jobSource: string, jobId: string) => {
    return !!appliedJobs[`${jobSource}-${jobId}`]
  }

  const getAppliedJobs = () => {
    return Object.values(appliedJobs).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
  }

  return {
    markAsApplied,
    removeApplied,
    isApplied,
    getAppliedJobs,
    appliedJobsCount: Object.keys(appliedJobs).length,
    isLoaded,
  }
}
