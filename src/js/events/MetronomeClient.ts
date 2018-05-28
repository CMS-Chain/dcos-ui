import { request } from "@dcos/http-service";

import Config from "../config/Config";

// TODO: fill me or file a JIRA
interface JobData {}
interface JobResponse {}

// TODO Rename it MetronomeClient
export function createJob(data: JobData) {
  return request(`${Config.metronomeAPI}/v0/scheduled-jobs`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function fetchJobs(): JobResponse[] {
  return request(`${Config.metronomeAPI}/v1/jobs?embed=activeRuns&embed=schedules&embed=historySummary`);
}
