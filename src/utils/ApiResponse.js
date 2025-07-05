class ApiResponse{
    constructor(statusCode, data, message='Success')
    {
        this.statusCode = statusCode || 200;
        this.data = data || null;
        this.message = message;
        this.success = statusCode;
    }
}
export {ApiResponse};