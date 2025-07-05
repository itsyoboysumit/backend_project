class ApiError extends Error {
    constructor(
        message = 'An error occurred',
        statusCode,
        error = [], 
        statck = ""
    ){
        super(message);
        this.statusCode = statusCode || 500;
        this.error = error;
        this.data = null;
        this.message = message;
        this.success = false;
        if(statck) {
            this.stack = statck;
        }else {
           Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};  