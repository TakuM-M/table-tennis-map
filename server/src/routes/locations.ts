import { Router } from 'express';
import {
  getAllLocations,
  getLocationById,
  searchLocations,
  createLocation,
  updateLocation
} from '../controllers/locationController.js';

const router = Router();

// ============================================
// 施設関連のルート定義
// ============================================

// 施設検索 (GET /api/locations/search)
// ⚠️ 注意: /searchは/:idより前に配置すること
router.get('/search', searchLocations);

// 全施設取得 (GET /api/locations)
router.get('/', getAllLocations);

// 施設登録 (POST /api/locations) - 管理者のみ
router.post('/', createLocation);

// 特定施設の詳細取得 (GET /api/locations/:id)
router.get('/:id', getLocationById);

// 施設更新 (PATCH /api/locations/:id) - 管理者のみ
router.patch('/:id', updateLocation);

export default router;