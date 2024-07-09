import { trace, Tracer, Span, SpanOptions, Attributes } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_TELEMETRY_SDK_LANGUAGE
} from '@opentelemetry/semantic-conventions';

export interface FakeSpan {
  children?: Array<FakeSpan>,
  params: SpanParameters
}

export interface SpanParameters {
  name: string,
  startTime: number, 
  endTime: number,
  attributes?: Attributes
}

export class TraceGenerator {
  private readonly collector_hostname: string;
  private readonly collector_port: number;
  private readonly tracer_name: string = 'trace-gen';
  private readonly tracer_version: string = '0.0.1';
  private readonly tracer_provider: NodeTracerProvider;
  private readonly tracer: Tracer;
  private readonly exporter: any;

  constructor(hostname: string, port: number) {
      this.collector_hostname = hostname;
      this.collector_port = port;
      
      this.exporter = new OTLPTraceExporter({url: `http://${this.collector_hostname}:${this.collector_port}`});
      
      this.tracer_provider = new NodeTracerProvider({
        resource: Resource.empty().merge(new Resource({
          [SEMRESATTRS_SERVICE_NAME]: 'trace-gen',
          [SEMRESATTRS_SERVICE_VERSION]: '1.0',
          [SEMRESATTRS_TELEMETRY_SDK_LANGUAGE]: 'java'
      }))});

      this.tracer_provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter));
      this.tracer_provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
      this.tracer_provider.register();
      this.tracer = trace.getTracer(this.tracer_name, this.tracer_version);

      const sdk = new NodeSDK();
      sdk.start();
  }

  writeSpan(fakeSpan: FakeSpan) {
    const params = fakeSpan.params;
    const opts: SpanOptions = {startTime: params.startTime, attributes: params.attributes};
    this.tracer.startActiveSpan(params.name, opts, (span: Span) => {
      fakeSpan.children?.forEach((child) => {
        this.writeSpan(child);
      });
      span.end(params.endTime);
    });
  }
}