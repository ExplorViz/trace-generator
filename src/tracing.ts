import {
  trace,
  Tracer,
  Span,
  SpanOptions,
  Attributes,
  context,
  Context,
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
import { HrTime } from "@opentelemetry/api";
import { addHrTimes, hrTime, millisToHrTime } from "@opentelemetry/core";

export interface FakeSpan {
  name: string;
  relativeStartTime: number;
  relativeEndTime: number;
  attributes?: Attributes;
  children: Array<FakeSpan>;
}

export type FakeTrace = Array<FakeSpan>;

export class TraceGenerator {
  private readonly tracer_name: string = "trace-gen";
  private readonly tracer_version: string = "0.0.1";
  private readonly sdk: NodeSDK;
  private collector_hostname: string;
  private collector_port: number;
  private tracer_provider: NodeTracerProvider;
  private tracer: Tracer;
  private spanProcessor: SimpleSpanProcessor;
  private exporter: OTLPTraceExporter;
  private context: Context;

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
    this.spanProcessor = new SimpleSpanProcessor(this.exporter);
    this.tracer_provider.addSpanProcessor(this.spanProcessor);
    // this.tracer_provider.addSpanProcessor(
    //   new SimpleSpanProcessor(new ConsoleSpanExporter()),
    // );
    this.tracer_provider.register();
    this.tracer = trace.getTracer(this.tracer_name, this.tracer_version);

    this.sdk = new NodeSDK();
    this.sdk.start();

    this.context = context.active();
  }

  setUrl(hostname: string, port: number) {
    if (this.collector_hostname === hostname && this.collector_port === port) {
      return;
    }

    this.collector_hostname = hostname;
    this.collector_port = port;
    this.spanProcessor.shutdown();
    this.exporter.shutdown();
    this.exporter = new OTLPTraceExporter({
      url: `http://${this.collector_hostname}:${this.collector_port}`,
    });
    this.spanProcessor = new SimpleSpanProcessor(this.exporter);
    this.tracer_provider.addSpanProcessor(this.spanProcessor);
  }

  private async writeSpan(
    fakeSpan: FakeSpan,
    globalStartTime: HrTime,
    realTime: boolean = false,
  ) {
    const opts: SpanOptions = {
      startTime: addHrTimes(
        globalStartTime,
        millisToHrTime(fakeSpan.relativeStartTime),
      ),
      attributes: fakeSpan.attributes,
    };

    this.tracer.startActiveSpan(fakeSpan.name, opts, async (span: Span) => {
      for (let i = 0; i < fakeSpan.children.length; i++) {
        const childSpan = fakeSpan.children[i];
        if (realTime) {
          await new Promise((r) =>
            setTimeout(
              r,
              childSpan.relativeStartTime - fakeSpan.relativeStartTime,
            ),
          );
        }
        this.writeSpan(childSpan, globalStartTime, realTime);
        if (realTime && i < fakeSpan.children.length - 1) {
          const nextChildSpan = fakeSpan.children[i + 1];
          await new Promise((r) =>
            setTimeout(
              r,
              nextChildSpan.relativeStartTime - childSpan.relativeEndTime,
            ),
          );
        }
      }
      span.end(
        addHrTimes(globalStartTime, millisToHrTime(fakeSpan.relativeEndTime)),
      );
    });
  }

  async writeTrace(fakeTrace: FakeTrace, realTime: boolean = false) {
    fakeTrace.forEach((span) => {
      this.writeSpan(span, hrTime(), realTime);
    });

    console.log("Trace written successfully");
  }

  async shutdown(): Promise<void> {
    await this.tracer_provider.forceFlush();
    return this.sdk.shutdown();
  }
}
