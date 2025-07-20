
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


const optionalAuth = async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      req.user = null; 
      return next();
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    req.user = user || null;
  } catch (error) {
    // Token is invalid → treat as guest
    req.user = null;
  }

  next();
};

export { optionalAuth };
