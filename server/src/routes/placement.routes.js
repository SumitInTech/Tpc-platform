const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');

router.use(auth);
router.use(authorizeRole('TPC_OFFICER', 'ADMIN'));

router.get('/', placementController.getPlacements);
router.get('/:id', placementController.getPlacement);
router.post('/', placementController.createPlacement);
router.put('/:id', placementController.updatePlacement);

module.exports = router;
