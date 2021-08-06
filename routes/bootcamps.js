const express = require('express')
const { 
    getBootcamps, 
    getBootcamp, 
    createBootcamp, 
    updateBootcamp, 
    deleteBootcamp,
    getBootcampsInRadius,
    bootcampPhotoUpload
} = require('../controllers/bootcamps.js');

const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResult.js');

// Include other resource routers
const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth')

// Re-route into other resource router
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)

router.route('/')
    .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp);

router.route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

router.route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload)

router.route('/radius/:zipcode/:distance')
    .get(getBootcampsInRadius)

module.exports = router;