const apiResponse = (code, message, data) => {
    return {
        code: code,
        message: message,
        data: data,
    };
};

export { apiResponse };
