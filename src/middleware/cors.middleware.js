import cors from "cors";

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

export default cors(corsOptions);
