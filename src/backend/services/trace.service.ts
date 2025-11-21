import { Attributes } from '@opentelemetry/api';
import { TraceGenerationRequest } from '@shared/types';
import { constants } from '../../constants';
import { CommunicationStyle, generateFakeTrace, TraceGenerationParameters } from '../../generation';
import { LandscapeStore } from '../../landscape';
import { FakeTraceExporter } from '../../tracing';
import { getHostIP, getHostname, isValidInteger } from '../../utils';

export class TraceService {
  private landscapeStore: LandscapeStore;
  private traceExporter: FakeTraceExporter;

  constructor(landscapeStore: LandscapeStore, traceExporter: FakeTraceExporter) {
    this.landscapeStore = landscapeStore;
    this.traceExporter = traceExporter;
  }

  /**
   * Generate and export a trace
   */
  generateAndExportTrace(request: TraceGenerationRequest): void {
    const landscape = this.landscapeStore.getLandscape();
    if (landscape === null) {
      throw new Error('No landscape available. Please generate a landscape first.');
    }

    // Set exporter URL
    this.traceExporter.setUrl(request.targetHostname, request.targetPort);

    // Build trace parameters
    const traceParams = this.buildTraceParameters(request);

    // Validate parameters
    this.validateTraceParameters(traceParams);

    // Generate trace
    const trace = generateFakeTrace(landscape, traceParams);

    // Export trace
    this.traceExporter.writeTrace(trace);
  }

  /**
   * Build TraceGenerationParameters from request
   */
  private buildTraceParameters(request: TraceGenerationRequest): TraceGenerationParameters {
    // Convert string communication style to enum using constants map
    const communicationStyleKey = request.communicationStyle;

    // Ensure constants map exists
    if (!constants?.COMMUNICATION_STYLE_NAMES) {
      throw new Error('COMMUNICATION_STYLE_NAMES not found in constants');
    }

    const communicationStyle = constants.COMMUNICATION_STYLE_NAMES[communicationStyleKey];
    if (communicationStyle === undefined || communicationStyle === null) {
      const availableKeys = Object.keys(constants.COMMUNICATION_STYLE_NAMES).join(', ');
      throw new Error(`Unknown communication style: "${communicationStyleKey}". Available styles: ${availableKeys}`);
    }

    return {
      duration: request.duration,
      callCount: request.callCount,
      maxConnectionDepth: request.maxCallDepth,
      communicationStyle,
      allowCyclicCalls: request.allowCyclicCalls,
      visitAllMethods: request.visitAllMethods || false,
      fixedAttributes: {
        ...request.customAttributes,
        host: getHostname(),
        host_address: getHostIP(),
      } as Attributes,
      seed:
        request.traceSeed !== undefined && isValidInteger(String(request.traceSeed))
          ? parseInt(String(request.traceSeed))
          : undefined,
    };
  }

  /**
   * Validate trace generation parameters
   */
  private validateTraceParameters(params: TraceGenerationParameters): void {
    if (params.duration < 1 || params.duration > constants.MAX_TRACE_DURATION) {
      throw new Error('Invalid duration');
    }
    if (params.callCount < 1 || params.callCount > constants.MAX_CALL_COUNT) {
      throw new Error('Invalid callCount');
    }
    if (params.maxConnectionDepth < 1 || params.maxConnectionDepth > constants.MAX_CONNECTION_DEPTH) {
      throw new Error('Invalid maxConnectionDepth');
    }
  }

  /**
   * Parse request body into TraceGenerationRequest
   */
  parseTraceRequest(body: any, communicationStyleMap: Record<string, CommunicationStyle>): TraceGenerationRequest {
    if (!(body.communicationStyle in communicationStyleMap)) {
      throw new Error(`Unknown communication style ${body.communicationStyle}`);
    }

    // Parse custom attributes
    const customAttributes: Record<string, string> = {};
    let customAttrCounter = 1;

    while (`key_customAttribute${customAttrCounter}` in body && `value_customAttribute${customAttrCounter}` in body) {
      const key = body[`key_customAttribute${customAttrCounter}`];
      const val = body[`value_customAttribute${customAttrCounter}`];
      if (typeof key === 'string' && typeof val === 'string') {
        customAttributes[key] = val;
      }
      customAttrCounter++;
    }

    return {
      targetHostname: body.targetHostname,
      targetPort: parseInt(body.targetPort),
      duration: parseInt(body.duration),
      callCount: parseInt(body.callCount),
      maxCallDepth: parseInt(body.maxCallDepth),
      communicationStyle: body.communicationStyle, // Keep as string, will be converted to enum in buildTraceParameters
      allowCyclicCalls: body.allowCyclicCalls === true || body.allowCyclicCalls === 'on',
      visitAllMethods: body.visitAllMethods === true || body.visitAllMethods === 'on',
      traceSeed:
        body.traceSeed !== undefined && isValidInteger(String(body.traceSeed)) ? parseInt(body.traceSeed) : undefined,
      customAttributes,
    };
  }
}
