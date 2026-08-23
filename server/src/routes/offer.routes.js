const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');

router.use(auth);

router.get('/', offerController.getOffers);
router.get('/:id', offerController.getOffer);

router.post('/', authorizeRole('TPC_OFFICER', 'ADMIN'), offerController.createOffer);
router.post('/:id/accept', authorizeRole('STUDENT', 'TPC_OFFICER', 'ADMIN'), offerController.acceptOffer);
router.post('/:id/decline', authorizeRole('STUDENT', 'TPC_OFFICER', 'ADMIN'), offerController.declineOffer);
router.post('/:id/withdraw', authorizeRole('TPC_OFFICER', 'ADMIN'), offerController.withdrawOffer);
router.post('/:id/revoke', authorizeRole('TPC_OFFICER', 'ADMIN'), offerController.revokeOffer);

module.exports = router;
