import { Router } from 'express';
import { FakeTraceExporter } from '../tracing';
import { TraceController } from '../controllers/trace.controller';
import { TraceService } from '../services/trace.service';
import { sharedLandscapeStore } from '../shared/landscape-store';

const router = Router();

// Default OpenTelemetry collector configuration (configurable via environment variables)
const DEFAULT_TARGET_HOSTNAME = process.env.OTEL_COLLECTOR_HOSTNAME || 'otel-collector';
const DEFAULT_TARGET_PORT = parseInt(process.env.OTEL_COLLECTOR_PORT || '55678', 10);

const traceExporter = new FakeTraceExporter(DEFAULT_TARGET_HOSTNAME, DEFAULT_TARGET_PORT);
const traceService = new TraceService(sharedLandscapeStore, traceExporter);
const traceController = new TraceController(traceService);

router.post('/', traceController.generateTrace);

export { router as traceRoutes };
