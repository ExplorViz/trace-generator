import {
  trace,
  Tracer,
  Span,
  SpanOptions,
  Attributes,
} from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { Resource } from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_SERVICE_INSTANCE_ID,
  SEMRESATTRS_TELEMETRY_SDK_LANGUAGE,
} from "@opentelemetry/semantic-conventions";

export interface FakeSpan {
  name: string;
  startTime: number;
  endTime: number;
  attributes?: Attributes;
  children: Array<FakeSpan>;
}

export type FakeTrace = Array<FakeSpan>;

export interface SpanParameters {}

export class TraceGenerator {
  private readonly tracer_name: string = "trace-gen";
  private readonly tracer_version: string = "0.0.1";
  private readonly sdk: NodeSDK;
  private collector_hostname: string;
  private collector_port: number;
  private tracer_provider: NodeTracerProvider;
  private tracer: Tracer;
  private exporter: OTLPTraceExporter;

  constructor(hostname: string, port: number) {
    this.collector_hostname = hostname;
    this.collector_port = port;
    this.exporter = new OTLPTraceExporter({
      url: `http://${this.collector_hostname}:${this.collector_port}`,
    });
    this.tracer_provider = new NodeTracerProvider({
      resource: Resource.empty().merge(
        new Resource({
          [SEMRESATTRS_SERVICE_NAME]: "trace-gen",
          [SEMRESATTRS_SERVICE_VERSION]: "1.0",
          [SEMRESATTRS_TELEMETRY_SDK_LANGUAGE]: "java",
        }),
      ),
    });
    this.tracer_provider.addSpanProcessor(
      new SimpleSpanProcessor(this.exporter),
    );
    this.tracer_provider.addSpanProcessor(
      new SimpleSpanProcessor(new ConsoleSpanExporter()),
    );
    this.tracer_provider.register();
    this.tracer = trace.getTracer(this.tracer_name, this.tracer_version);

    this.sdk = new NodeSDK();
    this.sdk.start();
  }

  setUrl(hostname: string, port: number) {
    this.tracer_provider.shutdown();
    this.collector_hostname = hostname;
    this.collector_port = port;
    this.exporter = new OTLPTraceExporter({
      url: `http://${this.collector_hostname}:${this.collector_port}`,
    });
    this.tracer_provider = new NodeTracerProvider({
      resource: Resource.empty().merge(
        new Resource({
          [SEMRESATTRS_SERVICE_NAME]: "trace-gen",
          [SEMRESATTRS_SERVICE_VERSION]: "1.0",
          [SEMRESATTRS_TELEMETRY_SDK_LANGUAGE]: "java",
        }),
      ),
    });
    this.tracer_provider.addSpanProcessor(
      new SimpleSpanProcessor(this.exporter),
    );
    this.tracer_provider.addSpanProcessor(
      new SimpleSpanProcessor(new ConsoleSpanExporter()),
    );
    this.tracer_provider.register();
    this.tracer = trace.getTracer(this.tracer_name, this.tracer_version);
  }

  writeSpan(fakeSpan: FakeSpan) {
    const opts: SpanOptions = {
      startTime: fakeSpan.startTime,
      attributes: fakeSpan.attributes,
    };
    this.tracer.startActiveSpan(fakeSpan.name, opts, (span: Span) => {
      fakeSpan.children?.forEach((child) => {
        this.writeSpan(child);
      });
      span.end(fakeSpan.endTime);
    });
  }

  writeTrace(fakeTrace: FakeTrace) {
    fakeTrace.forEach((span) => {
      this.writeSpan(span);
    });
  }

  shutdown(): Array<Promise<void>> {
    return [this.tracer_provider.shutdown(), this.sdk.shutdown()];
  }
}
