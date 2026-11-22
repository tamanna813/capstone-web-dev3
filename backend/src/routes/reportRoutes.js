const router = require('express').Router();
const c = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect, authorize('faculty', 'admin'));
router.get('/performance', c.performanceSummary);
router.get('/exam/:id/score-distribution', c.scoreDistribution);
module.exports = router;
