import {request} from "@dcos/http-service";

import Config from "../config/Config";

// TODO: fill me or file a JIRA
interface Job {

}

// TODO Rename it MetronomeClient
export function createJob(data: Job) {
  return request(`${Config.metronomeAPI}/v0/scheduled-jobs`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}
