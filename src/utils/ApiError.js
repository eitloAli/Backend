class ApiError extends Error {
    constructor(
        statusCode,
        messege = "Api is not working",
        error = [],
        stack = ""
    ) {
        super(messege)
        this.statusCode = statusCode
        this.data = null;
        this.success = false;
        this.error = error
        
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}