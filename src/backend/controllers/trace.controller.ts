import { Request, Response } from "express";
import { TraceService } from "../services/trace.service";
import { constants } from "../../constants";

export class TraceController {
  private traceService: TraceService;

  constructor(traceService: TraceService) {
    this.traceService = traceService;
  }

  /**
   * POST /api/traces - Generate and export trace
   */
  generateTrace = (req: Request, res: Response): void => {
    try {
      const request = this.traceService.parseTraceRequest(
        req.body,
        constants.COMMUNICATION_STYLE_NAMES,
      );
      this.traceService.generateAndExportTrace(request);
      res.status(204).send();
    } catch (error: any) {
      res
        .status(400)
        .json({ error: error.message || "Failed to generate trace" });
    }
  };
}
