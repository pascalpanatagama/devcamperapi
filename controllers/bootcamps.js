const path = require('path')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')
const Bootcamp = require('../models/Bootcamp')

// @desc    get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {

        res.status(200).json(
            res.advancedResults
        )
        // res.status(400).json({success: false})
})

// @desc    get singel bootcamps
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
        const bootcamp = await Bootcamp.findById(req.params.id)

        if(!bootcamp) {
            // return res.status(400).json({success: false})
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: bootcamp
        })
        // res.status(400).json({success: false})
        // next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
})

// @desc    create new bootcamps
// @route   POST /api/v1/bootcamps
// @access  Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    // add user to req.body
    req.body.user = req.user.id; 
    
    // Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

    // if user not admin, they can only add 1 bootcamp
    if(publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The user ID ${req.user.id} has already publish a bootcamp`, 400))
    }

    const bootcamp = await Bootcamp.create(req.body)

    res.status(201).json({
        success: true,
        data: bootcamp
    })
        // res.status(400).json({success: false})

    // console.log(req.body)
    // res.status(200).json({success: true, msg: `create new bootcamp`})
})

// @desc    update bootcamps
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {

        let bootcamp = await Bootcamp.findById(req.params.id);

        if(!bootcamp){
            // return res.status(400).json({ success: false })
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }

        // Make sure user is bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`, 401))
        }

        bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })

        res.status(200).json({
            success: true, 
            data: bootcamp 
        })
        // res.status(400).json({ success: false})
})

// @desc    delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
        const bootcamp = await Bootcamp.findById(req.params.id)

        if(!bootcamp){
            // return res.status(400).json({ success: false })
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }

        // Make sure user is bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User ${req.params.id} is not authorized to delete this bootcamp`, 401))
        }

        bootcamp.remove();

        res.status(200).json({
            success: true, 
            msg: `bootcamp deleted`
        })
        // res.status(400).json({ success: false})
})

// @desc    get bootcamp within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params;

    // get lat/long from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // calc radius using radians
    // divide distance by radius of Earth
    // earth radius = 3963 mile / 6378 km
    const radius = distance / 6378

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [
                    [ lng, lat ], radius
                ]
            }
        }
    })
    
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })

})

// @desc    Upload bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    if(!bootcamp){
        // return res.status(400).json({ success: false })
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`, 401))
    }

    if(!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;

    // make sure the image is photo
    if(!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // CHeck file size
    if(file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    // Create custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if(err){
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 400));
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

        res.status(200).json({
            success: true,
            data: file.name
        })
    })

})