import { Router } from 'express';
import { TraceController } from '../controllers/trace.controller';
import { TraceService } from '../services/trace.service';
import { FakeTraceExporter } from '../../tracing';
import { sharedLandscapeStore } from '../shared/landscape-store';

const router = Router();

const DEFAULT_TARGET_HOSTNAME = 'otel-collector';
const DEFAULT_TARGET_PORT = 55678;

const traceExporter = new FakeTraceExporter(DEFAULT_TARGET_HOSTNAME, DEFAULT_TARGET_PORT);
const traceService = new TraceService(sharedLandscapeStore, traceExporter);
const traceController = new TraceController(traceService);

router.post('/', traceController.generateTrace);

export { router as traceRoutes };
