const { metrics } = require("@opentelemetry/api");

const meter = metrics.getMeter("qommity-worker-test");

let latestJobDurationMs = 0;
let successTotal = 0;
let failureTotal = 0;
let currentQueueLag = 0;

const jobDuration = meter.createObservableGauge("job.duration", {
  unit: "ms",
  description: "Latest worker job processing duration",
});
const jobSuccessCount = meter.createObservableCounter("job.success_count", {
  unit: "1",
  description: "Completed worker jobs",
});
const jobFailureCount = meter.createObservableCounter("job.failure_count", {
  unit: "1",
  description: "Failed worker jobs",
});
const queueLag = meter.createObservableGauge("queue.lag", {
  unit: "jobs",
  description: "Queued worker jobs waiting to be processed",
});

jobDuration.addCallback((observableResult) => {
  observableResult.observe(latestJobDurationMs, { "job.name": "demo-import-job" });
});

jobSuccessCount.addCallback((observableResult) => {
  observableResult.observe(successTotal, { "job.name": "demo-import-job" });
});

jobFailureCount.addCallback((observableResult) => {
  observableResult.observe(failureTotal, { "job.name": "demo-import-job" });
});

queueLag.addCallback((observableResult) => {
  observableResult.observe(currentQueueLag, { "job.name": "demo-import-job" });
});

function recordWorkerJob({ durationMs, success, queueLag: nextQueueLag }) {
  latestJobDurationMs = Math.max(0, Number(durationMs) || 0);
  currentQueueLag = Math.max(0, Number(nextQueueLag) || 0);

  if (success) {
    successTotal += 1;
  } else {
    failureTotal += 1;
  }
}

module.exports = { recordWorkerJob };
