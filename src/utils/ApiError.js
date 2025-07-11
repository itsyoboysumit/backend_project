class ApiError extends Error {
    constructor(
        message = 'An error occurred',
        statusCode,
        error = [], 
        stack = ""
    ){
        // Auto-fix: if message and statusCode are swapped
        if (typeof message === 'number' && typeof statusCode === 'string') {
            [message, statusCode] = [statusCode, message];
        }
        super(message);
        this.statusCode = statusCode || 500;
        this.error = error;
        this.data = null;
        this.message = message;
        this.success = false;
        if(this.stack) {
            this.stack = stack;
        }else {
           Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};  