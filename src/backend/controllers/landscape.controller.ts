import { Request, Response } from 'express';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { LandscapeService } from '../services/landscape.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        res.status(404).json({ error: 'No landscape has been generated yet' });
        return;
      }
      res.status(200).json(landscape);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
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
      res.status(400).json({ error: error.message || 'Failed to generate landscape' });
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
      res.status(400).json({ error: error.message || 'Failed to update landscape' });
    }
  };

  /**
   * GET /api/landscape/presets - List available preset landscapes
   */
  listPresets = async (req: Request, res: Response): Promise<void> => {
    try {
      // Try multiple possible paths for preset landscapes
      const possiblePaths = [
        // Development: from source directory
        path.join(process.cwd(), 'public/resources/preset-landscapes'),
        // Development: relative to compiled controller
        path.join(__dirname, '../../public/resources/preset-landscapes'),
        // Production: from dist
        path.join(__dirname, '../../dist/public/resources/preset-landscapes'),
        // Production: from process.cwd
        path.join(process.cwd(), 'dist/public/resources/preset-landscapes'),
      ];

      let presetDir: string | null = null;
      for (const possiblePath of possiblePaths) {
        try {
          await readdir(possiblePath);
          presetDir = possiblePath;
          break;
        } catch {
          // Continue to next path
        }
      }

      if (!presetDir) {
        // No preset directory found, return empty array
        res.status(200).json([]);
        return;
      }

      const files = await readdir(presetDir);
      const presetFiles = files
        .filter((file) => file.endsWith('.json'))
        .map((file) => ({
          name: file.replace('.json', ''),
          filename: file,
        }));

      res.status(200).json(presetFiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to list preset landscapes' });
    }
  };

  /**
   * GET /api/landscape/presets/:name - Load a specific preset landscape
   */
  loadPreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const presetName = req.params.name;
      if (!presetName || !presetName.match(/^[a-zA-Z0-9_-]+$/)) {
        res.status(400).json({ error: 'Invalid preset name' });
        return;
      }

      // Try multiple possible paths for preset landscapes
      const possiblePaths = [
        // Development: from source directory
        path.join(process.cwd(), 'public/resources/preset-landscapes', `${presetName}.json`),
        // Development: relative to compiled controller
        path.join(__dirname, '../../public/resources/preset-landscapes', `${presetName}.json`),
        // Production: from dist
        path.join(__dirname, '../../dist/public/resources/preset-landscapes', `${presetName}.json`),
        // Production: from process.cwd
        path.join(process.cwd(), 'dist/public/resources/preset-landscapes', `${presetName}.json`),
      ];

      let presetFile: string | null = null;
      for (const possiblePath of possiblePaths) {
        try {
          await readFile(possiblePath);
          presetFile = possiblePath;
          break;
        } catch {
          // Continue to next path
        }
      }

      if (!presetFile) {
        res.status(404).json({ error: `Preset landscape "${presetName}" not found` });
        return;
      }

      const fileContent = await readFile(presetFile, 'utf-8');
      const landscapeData = JSON.parse(fileContent);

      if (!Array.isArray(landscapeData)) {
        res.status(400).json({ error: 'Invalid landscape file: must be an array' });
        return;
      }

      // Validate the data structure first by attempting to serialize it
      // This ensures the preset file itself doesn't have circular references
      try {
        JSON.stringify(landscapeData);
      } catch {
        res.status(400).json({ error: 'Preset landscape file contains circular references' });
        return;
      }

      // Deep clone the landscape data to avoid mutating the original
      // This is necessary because updateLandscape will reconstruct parent references
      // which modifies objects in place, creating circular references
      const clonedLandscapeData = JSON.parse(JSON.stringify(landscapeData));

      // Update the landscape store with the cloned preset (this reconstructs parent references internally)
      // The cloned data will be modified, but the original landscapeData remains clean
      this.landscapeService.updateLandscape(clonedLandscapeData);

      // Return the original landscape data (already in CleanedLandscape format)
      // This avoids any circular reference issues from the reconstruction process
      res.status(200).json(landscapeData);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: `Preset landscape "${req.params.name}" not found` });
      } else if (error instanceof SyntaxError) {
        res.status(400).json({ error: 'Invalid JSON in preset landscape file' });
      } else {
        res.status(500).json({ error: error.message || 'Failed to load preset landscape' });
      }
    }
  };
}
