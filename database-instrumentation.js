require('dotenv').config();

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { resourceFromAttributes } = require('@opentelemetry/resources');

function normalizeOrigin(value) {
  return (value || 'http://localhost:3001')
    .replace(/\/$/, '')
    .replace(/\/api\/ingest.*$/, '')
    .replace(/\/api$/, '');
}

function maskKey(value) {
  if (!value || value.length <= 12) {
    return value || '<missing>';
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

const ingestOrigin = normalizeOrigin(process.env.QOMMITY_INGEST_ORIGIN);
const serviceName = process.env.QOMMITY_DATABASE_SERVICE_NAME || process.env.QOMMITY_SERVICE_NAME;
const serverKey = process.env.QOMMITY_DATABASE_SERVER_KEY || process.env.QOMMITY_SERVER_KEY;

if (!serviceName) {
  throw new Error('Missing QOMMITY_DATABASE_SERVICE_NAME. Copy it from the Qommity Database setup page.');
}

if (!serverKey) {
  throw new Error('Missing QOMMITY_DATABASE_SERVER_KEY. Generate Database credentials in Qommity and paste the server key into .env.');
}

const qommityHeaders = { 'X-Qommity-Key': serverKey };

const sdk = new NodeSDK({
  resource: resourceFromAttributes({ 'service.name': serviceName }),
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

console.log(`[database-otel] ingestOrigin=${ingestOrigin}`);
console.log(`[database-otel] service.name=${serviceName}`);
console.log(`[database-otel] serverKey=${maskKey(serverKey)}`);

async function shutdown() {
  try {
    await sdk.shutdown();
  } catch (error) {
    console.error('[database-otel] shutdown failed', error);
  }
}

process.once('SIGINT', () => {
  shutdown().finally(() => process.exit(0));
});

process.once('SIGTERM', () => {
  shutdown().finally(() => process.exit(0));
});
