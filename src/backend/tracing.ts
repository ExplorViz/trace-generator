import { Span, SpanOptions, Attributes } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ReadableSpan, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_TELEMETRY_SDK_LANGUAGE } from '@opentelemetry/semantic-conventions';
import { HrTime } from '@opentelemetry/api';
import { addHrTimes, ExportResult, hrTime, millisToHrTime } from '@opentelemetry/core';

export interface FakeSpan {
  name: string;
  service: string;
  relativeStartTime: number;
  relativeEndTime: number;
  attributes?: Attributes;
  children: Array<FakeSpan>;
}

export type FakeTrace = Array<FakeSpan>;

export class FakeTraceExporter {
  private readonly tracerName = 'trace-generator';
  private readonly sdk = new NodeSDK();
  private tracerProviders = new Map<string, NodeTracerProvider>();
  private exporter: DynamicUrlExporter;

  constructor(hostname: string, port: number) {
    this.exporter = new DynamicUrlExporter(hostname, port);
    this.sdk.start();
  }

  setUrl(hostname: string, port: number) {
    this.exporter.setUrl(hostname, port);
  }

  private writeSpan(fakeSpan: FakeSpan, globalStartTime: HrTime) {
    const opts: SpanOptions = {
      startTime: addHrTimes(globalStartTime, millisToHrTime(fakeSpan.relativeStartTime)),
      attributes: fakeSpan.attributes,
    };

    let tracerProvider = this.tracerProviders.get(fakeSpan.service);
    if (tracerProvider === undefined) {
      tracerProvider = new NodeTracerProvider({
        resource: new Resource({
          [ATTR_SERVICE_NAME]: fakeSpan.service,
          [ATTR_TELEMETRY_SDK_LANGUAGE]: 'java',
        }),
        spanProcessors: [new SimpleSpanProcessor(this.exporter)],
      });
      this.tracerProviders.set(fakeSpan.service, tracerProvider);
    }
    const tracer = tracerProvider.getTracer(this.tracerName);

    tracer.startActiveSpan(fakeSpan.name, opts, async (span: Span) => {
      fakeSpan.children.forEach((childSpan) => {
        this.writeSpan(childSpan, globalStartTime);
      });
      span.end(addHrTimes(globalStartTime, millisToHrTime(fakeSpan.relativeEndTime)));
    });
  }

  writeTrace(fakeTrace: FakeTrace) {
    fakeTrace.forEach((span) => {
      this.writeSpan(span, hrTime());
    });
    console.log('Trace written successfully');
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.tracerProviders.values().map((t) => t.forceFlush()));
    return this.sdk.shutdown();
  }
}

/**
 * Delegates calls to an instance of {@link OTLPTraceExporter} and allows
 * dynamically changing the target URL by swapping out the underlying exporter instance.
 */
class DynamicUrlExporter {
  private hostname: string;
  private port: number;
  private exporter: OTLPTraceExporter;

  constructor(hostname: string, port: number) {
    this.hostname = hostname;
    this.port = port;
    this.exporter = new OTLPTraceExporter({
      url: `http://${hostname}:${port}`,
      concurrencyLimit: Infinity,
    });
  }

  setUrl(hostname: string, port: number) {
    if (this.hostname === hostname && this.port === port) {
      return;
    }

    this.hostname = hostname;
    this.port = port;
    this.exporter.shutdown();
    this.exporter = new OTLPTraceExporter({
      url: `http://${hostname}:${port}`,
      concurrencyLimit: Infinity,
    });
  }

  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) {
    this.exporter.export(spans, resultCallback);
  }

  shutdown(): Promise<void> {
    return this.exporter.shutdown();
  }

  forceFlush?(): Promise<void> {
    return this.exporter.forceFlush();
  }
}
