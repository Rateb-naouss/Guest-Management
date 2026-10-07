import { Router } from 'express';
import { GuestController } from '../controllers/guestController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Guest CRUD and filtering
router.get('/', GuestController.getGuests);
router.get('/:id', GuestController.getGuestById);
router.post('/', requireAuth, GuestController.createGuest);
router.put('/:id', requireAuth, GuestController.updateGuest);
router.delete('/:id', requireAuth, GuestController.deleteGuest);

// Dedicated operations
router.put('/:id/assign-table', requireAuth, GuestController.assignTable);
router.put('/:id/invitation', requireAuth, GuestController.updateInvitationStatus);
router.put('/:id/response', requireAuth, GuestController.updateResponseStatus);

export default router;
