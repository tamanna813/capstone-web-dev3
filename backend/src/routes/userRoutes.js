const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect, authorize('admin'));
router.route('/').get(c.listUsers).post(c.createUser);
router.route('/:id').patch(c.updateUser).delete(c.deleteUser);
module.exports = router;
