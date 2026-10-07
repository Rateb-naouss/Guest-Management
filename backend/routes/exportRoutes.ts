import { Router } from 'express';
import { ExportController } from '../controllers/exportController.js';

const router = Router();

router.get('/excel', ExportController.exportExcel);

export default router;
