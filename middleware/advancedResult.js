const advancedResults = (model, populate) => async (req, res, next) => {
    // need prefix $ for gt,gte,lt,lte,in from mongoose db syntax

    let query;

    // copy req.query
    const reqQuery = { ...req.query }

    // field to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // console.log(reqQuery)

    // create query string
    let queryStr = JSON.stringify(reqQuery);

    // create operators($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
    
    // finding resources
    query = model.find(JSON.parse(queryStr));

    // Select fields
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ');
        // console.log(fields)
        query = query.select(fields)
    }

    // sort fields
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt')
    }

    // Pagination fields
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page-1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments();

    query = query.skip(startIndex).limit(limit);

    if(populate) {
        query = query.populate(populate)
    }

    // executing query
    const results = await query;

    // Pagination result
    const pagination = {};

    if(endIndex < total) {
        pagination.next = {
            page: page+1,
            limit: limit
        }
    }

    if(startIndex > 0) {
        pagination.prev = {
            page: page-1,
            limit: limit
        }
    }

    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }
    next()
}

module.exports = advancedResults;