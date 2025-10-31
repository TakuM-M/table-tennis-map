import { Router } from 'express';
import { getAllLocations, getLocationById, searchLocations, getLocationReviews } from '../controllers/locationController.js';
import { validateSearchParams } from '../middleware/locationMiddleware.js';

const router = Router();

router.get('/', getAllLocations);
router.get('/search', validateSearchParams, searchLocations);
router.get('/:id/reviews', getLocationReviews);
router.get('/:id', getLocationById);


export default router;
