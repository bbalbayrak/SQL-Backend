import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";

const QOMMITY_HEADERS = {
  "X-Qommity-Key":
    "qom_sk_225c577474ba447eba58f3f61e0819ba2ebdba95a0958cfdd5dbf7e1e89c4f4c",
};

const sdk = new NodeSDK({
  resource: resourceFromAttributes({ "service.name": "test api-production" }),
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
