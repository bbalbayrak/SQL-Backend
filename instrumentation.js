import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";

const QOMMITY_HEADERS = {
  "X-Qommity-Key":
    "qom_sk_4288c038648a5c88662bfc2b4e830a5f08c027aeb738cd7d7d43034970745d5d",
};

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    "service.name": "SQL-Backend-Test-development",
  }),
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:3001/api/ingest/v1/traces",
    headers: QOMMITY_HEADERS,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: "http://localhost:3001/api/ingest/v1/metrics",
      headers: QOMMITY_HEADERS,
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
