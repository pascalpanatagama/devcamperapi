const express = require('express')
const {
    createUser,
    getUser,
    getUsers,
    updateUser,
    deleteUser
} = require('../controllers/users')

const User = require('../models/User')
const advancedResult = require('../middleware/advancedResult')

const router = express.Router();

const { protect, authorize } = require('../middleware/auth')

router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(advancedResult(User),getUsers)
    .post(createUser)

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser)

module.exports = router;