const { recordWorkerJob } = require("./worker-metrics");

let queueDepth = 12;
let jobNumber = 0;

function runJob() {
  jobNumber += 1;
  queueDepth = Math.max(0, queueDepth + Math.floor(Math.random() * 5) - 2);

  const durationMs = 120 + Math.floor(Math.random() * 900);
  const success = jobNumber % 7 !== 0;

  recordWorkerJob({
    durationMs,
    success,
    queueLag: queueDepth,
    jobName: "demo-import-job",
  });

  console.log(
    `[worker] job=${jobNumber} status=${success ? "success" : "failed"} durationMs=${durationMs} queueLag=${queueDepth}`,
  );
}

console.log("Worker metric simulator started. Press Ctrl+C to stop.");
setInterval(runJob, 2000);
runJob();
