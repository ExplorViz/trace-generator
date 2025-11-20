import { Request, Response } from "express";
import { LandscapeService } from "../services/landscape.service";

export class LandscapeController {
  private landscapeService: LandscapeService;

  constructor(landscapeService: LandscapeService) {
    this.landscapeService = landscapeService;
  }

  /**
   * GET /api/landscape - Get current landscape
   */
  getLandscape = (req: Request, res: Response): void => {
    try {
      const landscape = this.landscapeService.getLandscape();
      if (landscape === null) {
        res.status(404).json({ error: "No landscape has been generated yet" });
        return;
      }
      res.status(200).json(landscape);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  };

  /**
   * POST /api/landscape - Generate new landscape
   */
  generateLandscape = (req: Request, res: Response): void => {
    try {
      const params = this.landscapeService.parseGenerationRequest(req.body);
      const landscape = this.landscapeService.generateLandscape(params);
      res.status(200).json(landscape);
    } catch (error: any) {
      res
        .status(400)
        .json({ error: error.message || "Failed to generate landscape" });
    }
  };

  /**
   * PUT /api/landscape - Update landscape
   */
  updateLandscape = (req: Request, res: Response): void => {
    try {
      const landscape = this.landscapeService.updateLandscape(req.body);
      res.status(200).json(landscape);
    } catch (error: any) {
      res
        .status(400)
        .json({ error: error.message || "Failed to update landscape" });
    }
  };
}
