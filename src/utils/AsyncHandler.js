const asyncHandler = (fn) => async (req, res, next) => {
    try {
        return await fn(req, res, next);
    } catch (err) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        });
    }
};

export { asyncHandler };