const router = require('express').Router();
const c = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect, authorize('faculty', 'admin'));
router.route('/').get(c.listQuestions).post(c.createQuestion);
router.route('/:id').patch(c.updateQuestion).delete(c.deleteQuestion);
module.exports = router;
