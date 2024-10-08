import { errorsCode } from "../enums/errorsCode.js";
import ApiException from "../utils/apiException.js";
import Exception from "../utils/exception.js";
import { verifyToken } from "../utils/jwt.js";

const whitelist = ["login", "signup"];

const authentication = async (req, res, next) => {
    const url = req.originalUrl;

    for (const item of whitelist) {
        if (url.includes(item)) {
            return next();
        }
    }

    const accessToken = req.headers?.authorization?.replace("Bearer ", "");

    try {
        if (!accessToken) {
            throw new ApiException(997, errorsCode.FORBIDDEN, null);
        }
        // Verify token
        const data = verifyToken(accessToken);
        req.user = data;
        next();
    } catch (error) {
        Exception.handle(error, req, res);
    }
};

export default authentication;
