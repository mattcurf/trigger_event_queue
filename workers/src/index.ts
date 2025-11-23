import { webhook } from "@trigger.dev/sdk/v3";
import { processJob } from "./processJob";

interface JobPayload {
  job_id: string;
  task_name: string;
}

export const jobWebhook = webhook<JobPayload>({
  id: "job-processor",
  url: "/webhooks/job",
  handleRequest: async (request) => {
    const body = await request.json();
    return await processJob(body);
  },
});
