require("dotenv").config();

const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http");
const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { resourceFromAttributes } = require("@opentelemetry/resources");

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const ingestOrigin = (process.env.QOMMITY_INGEST_ORIGIN || "http://localhost:3001").replace(/\/$/, "");
const serviceName = process.env.QOMMITY_WORKER_SERVICE_NAME || process.env.QOMMITY_SERVICE_NAME;
const serverKey = process.env.QOMMITY_WORKER_SERVER_KEY || process.env.QOMMITY_SERVER_KEY;

if (!serviceName) {
  throw new Error("Missing QOMMITY_WORKER_SERVICE_NAME. Copy the service name from the Worker system setup page.");
}

if (!serverKey) {
  throw new Error("Missing QOMMITY_WORKER_SERVER_KEY. Copy the server key from the Worker system setup page.");
}

const qommityHeaders = { "X-Qommity-Key": serverKey };

console.log(`[worker-otel] ingestOrigin=${ingestOrigin}`);
console.log(`[worker-otel] service.name=${serviceName}`);
console.log(`[worker-otel] serverKey=${serverKey.slice(0, 8)}...${serverKey.slice(-4)}`);

const sdk = new NodeSDK({
  resource: resourceFromAttributes({ "service.name": serviceName }),
  traceExporter: new OTLPTraceExporter({
    url: `${ingestOrigin}/api/ingest/v1/traces`,
    headers: qommityHeaders,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${ingestOrigin}/api/ingest/v1/metrics`,
      headers: qommityHeaders,
    }),
    exportIntervalMillis: 5000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

async function shutdown() {
  await sdk.shutdown();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
