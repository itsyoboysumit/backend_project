import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";

 const verifyJWT = asyncHandler(async (req, _, next) => {
    try{
        const token = req.cookies?.accessToken || req.header("Authrorization")?.replace("Bearer", "")
        if(!token){
            throw new ApiError("Unaurthorized request", 401)
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("deocded",decodedToken)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        console.log(user);
        if(!user){
            throw new ApiError("Invalid Access Token", 401)
        }

        req.user = user;
        next()
    }catch(error){
        throw new ApiError(error?.message || "Invalid access token",401)
    }
})

export {verifyJWT}