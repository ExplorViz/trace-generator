import { Router } from 'express';
import { LandscapeController } from '../controllers/landscape.controller';
import { LandscapeService } from '../services/landscape.service';
import { sharedLandscapeStore } from '../shared/landscape-store';

const router = Router();
const landscapeService = new LandscapeService(sharedLandscapeStore);
const landscapeController = new LandscapeController(landscapeService);

router.get('/', landscapeController.getLandscape);
router.post('/', landscapeController.generateLandscape);
router.put('/', landscapeController.updateLandscape);
router.get('/presets', landscapeController.listPresets);
router.get('/presets/:name', landscapeController.loadPreset);

export { router as landscapeRoutes };
