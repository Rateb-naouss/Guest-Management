import { Router } from 'express';
import { TableController } from '../controllers/tableController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', TableController.getTables);
router.get('/:tableNumber', TableController.getTableByNumber);
router.post('/', requireAuth, TableController.createTable);
router.put('/:tableNumber', requireAuth, TableController.updateTable);
router.delete('/:tableNumber', requireAuth, TableController.deleteTable);

// Seating management
router.post('/:tableNumber/assign', requireAuth, TableController.assignGuestToTable);
router.delete('/:tableNumber/guests/:guestId', requireAuth, TableController.removeGuestFromTable);

export default router;
