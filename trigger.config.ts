import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "trigger_event_queue",
  logLevel: "log",
  retryWithExponentialBackoff: {
    minDelayInMs: 1000,
    maxDelayInMs: 60000,
    factor: 2,
    randomizationFactor: 0.1,
  },
  runtime: "node",
  maxDuration: 3600,
});
