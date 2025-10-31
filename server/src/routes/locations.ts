import { Router } from 'express';
import { getAllLocations, getLocationById, searchLocations } from '../controllers/locationController.js';

const router = Router();

router.get('/', getAllLocations);
router.get('/:id', getLocationById);
router.get('/search', searchLocations);

export default router;
