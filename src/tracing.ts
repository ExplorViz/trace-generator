import { trace, Tracer, Span, SpanOptions, Attributes } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { emptyResource, defaultResource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_TELEMETRY_SDK_LANGUAGE,
} from '@opentelemetry/semantic-conventions';
import { HrTime } from '@opentelemetry/api';
import { addHrTimes, hrTime, millisToHrTime } from '@opentelemetry/core';

export interface FakeSpan {
  name: string;
  relativeStartTime: number;
  relativeEndTime: number;
  attributes?: Attributes;
  children: Array<FakeSpan>;
}

export type FakeTrace = Array<FakeSpan>;

export class FakeTraceExporter {
  private readonly tracerName: string = 'trace-generator';
  private readonly sdk: NodeSDK;
  private collectorHostname: string;
  private collectorPort: number;
  private tracerProvider: NodeTracerProvider;
  private tracer: Tracer;
  private spanProcessor: SimpleSpanProcessor;
  private exporter: OTLPTraceExporter;

  constructor(hostname: string, port: number) {
    this.collectorHostname = hostname;
    this.collectorPort = port;
    this.exporter = new OTLPTraceExporter({
      url: `http://${this.collectorHostname}:${this.collectorPort}`,
      concurrencyLimit: Infinity,
    });
    this.tracerProvider = new NodeTracerProvider({
      resource: emptyResource().merge(
        defaultResource({
          [SEMRESATTRS_SERVICE_NAME]: 'trace-generator',
          [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
          [SEMRESATTRS_TELEMETRY_SDK_LANGUAGE]: 'java',
        })
      ),
    });
    this.spanProcessor = new SimpleSpanProcessor(this.exporter);
    this.tracerProvider.addSpanProcessor(this.spanProcessor);
    this.tracerProvider.register();
    this.tracer = trace.getTracer(this.tracerName);

    this.sdk = new NodeSDK();
    this.sdk.start();
  }

  setUrl(hostname: string, port: number) {
    if (this.collectorHostname === hostname && this.collectorPort === port) {
      return;
    }

    this.collectorHostname = hostname;
    this.collectorPort = port;
    this.spanProcessor.shutdown();
    this.exporter.shutdown();
    this.exporter = new OTLPTraceExporter({
      url: `http://${this.collectorHostname}:${this.collectorPort}`,
      concurrencyLimit: Infinity,
    });
    this.spanProcessor = new SimpleSpanProcessor(this.exporter);
    this.tracerProvider.addSpanProcessor(this.spanProcessor);
  }

  private writeSpan(fakeSpan: FakeSpan, globalStartTime: HrTime) {
    const opts: SpanOptions = {
      startTime: addHrTimes(globalStartTime, millisToHrTime(fakeSpan.relativeStartTime)),
      attributes: fakeSpan.attributes,
    };

    this.tracer.startActiveSpan(fakeSpan.name, opts, async (span: Span) => {
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
    await this.tracerProvider.forceFlush();
    return this.sdk.shutdown();
  }
}
