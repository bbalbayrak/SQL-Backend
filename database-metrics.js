const { metrics } = require('@opentelemetry/api');

const meter = metrics.getMeter('qommity-database-test');
const PEAK_RETENTION_MS = Number(process.env.DB_METRIC_PEAK_RETENTION_MS || 30000);

let latestQueryDurationMs = 0;
let queryTotal = 0;
let errorTotal = 0;
let transactionTotal = 0;
let currentActiveConnections = 0;
let currentConnectionWaitMs = 0;
let peakActiveConnections = 0;
let peakConnectionWaitMs = 0;
let peakRetainUntil = 0;

const queryDuration = meter.createObservableGauge('db.query.duration', {
  unit: 'ms',
  description: 'Latest database query duration',
});
const queryCount = meter.createObservableCounter('db.query.count', {
  unit: '1',
  description: 'Completed database query attempts',
});
const errorCount = meter.createObservableCounter('db.error_count', {
  unit: '1',
  description: 'Failed database query attempts',
});
const transactionCount = meter.createObservableCounter('db.transaction.count', {
  unit: '1',
  description: 'Completed database transactions or logical units of work',
});
const activeConnectionGauge = meter.createObservableGauge('db.connection.active', {
  unit: 'connections',
  description: 'Active database connections',
});
const connectionWaitGauge = meter.createObservableGauge('db.connection.wait', {
  unit: 'ms',
  description: 'Latest database pool connection wait time',
});

function retainedActiveConnections() {
  if (Date.now() <= peakRetainUntil) {
    return Math.max(currentActiveConnections, peakActiveConnections);
  }

  return currentActiveConnections;
}

function retainedConnectionWaitMs() {
  if (Date.now() <= peakRetainUntil) {
    return Math.max(currentConnectionWaitMs, peakConnectionWaitMs);
  }

  return currentConnectionWaitMs;
}

queryDuration.addCallback((result) => {
  result.observe(latestQueryDurationMs, { 'db.system': 'postgresql' });
});

queryCount.addCallback((result) => {
  result.observe(queryTotal, { 'db.system': 'postgresql' });
});

errorCount.addCallback((result) => {
  result.observe(errorTotal, { 'db.system': 'postgresql' });
});

transactionCount.addCallback((result) => {
  result.observe(transactionTotal, { 'db.system': 'postgresql' });
});

activeConnectionGauge.addCallback((result) => {
  result.observe(retainedActiveConnections(), { 'db.system': 'postgresql' });
});

connectionWaitGauge.addCallback((result) => {
  result.observe(retainedConnectionWaitMs(), { 'db.system': 'postgresql' });
});

function recordDbQuery({ durationMs, success }) {
  latestQueryDurationMs = Math.max(0, Number(durationMs) || 0);
  queryTotal += 1;

  if (!success) {
    errorTotal += 1;
  }
}

function recordDbTransaction() {
  transactionTotal += 1;
}

function updateDbPoolMetrics({ active, waitMs }) {
  currentActiveConnections = Math.max(0, Number(active) || 0);
  currentConnectionWaitMs = Math.max(0, Number(waitMs) || 0);

  if (currentActiveConnections > 0 || currentConnectionWaitMs > 0) {
    peakActiveConnections = Math.max(peakActiveConnections, currentActiveConnections);
    peakConnectionWaitMs = Math.max(peakConnectionWaitMs, currentConnectionWaitMs);
    peakRetainUntil = Date.now() + PEAK_RETENTION_MS;
  }

  if (Date.now() > peakRetainUntil) {
    peakActiveConnections = currentActiveConnections;
    peakConnectionWaitMs = currentConnectionWaitMs;
  }
}

module.exports = {
  recordDbQuery,
  recordDbTransaction,
  updateDbPoolMetrics,
};
