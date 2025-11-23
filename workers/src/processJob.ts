import { WebhookEvent, logger } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with Service Role
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface JobPayload {
  job_id: string;
  task_name: string;
}

export async function processJob(event: WebhookEvent<JobPayload>) {
  const { job_id, task_name } = event.body;

  logger.log(`Processing job: ${job_id} with task: ${task_name}`);

  try {
    // Simulate work with delay (5-10 seconds)
    const delayMs = Math.random() * 5000 + 5000; // 5-10 seconds
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Generate result string
    const result = `Task "${task_name}" completed successfully after ${Math.round(delayMs / 1000)} seconds`;

    logger.log(`Job result: ${result}`);

    // Update job_results table with completion status
    const { error } = await supabase
      .from("job_results")
      .update({
        status: "completed",
        result: result,
      })
      .eq("job_id", job_id);

    if (error) {
      logger.error(`Failed to update job results: ${error.message}`);
      throw error;
    }

    logger.log(`Successfully updated job ${job_id} to completed status`);
    return { success: true, job_id, result };
  } catch (error) {
    logger.error(`Error processing job ${job_id}: ${error}`);

    // Update status to failed
    await supabase
      .from("job_results")
      .update({
        status: "failed",
        result: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
      .eq("job_id", job_id);

    throw error;
  }
}
