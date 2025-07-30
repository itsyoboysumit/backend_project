import mongoose from "mongoose";
import dotenv from "dotenv";
import { Video } from "./src/models/video.model.js"; // ✅ correct

dotenv.config();

const fixInsecureUrls = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const videos = await Video.find({
      $or: [
        { videoFile: /^http:\/\// },
        { thumbnail: /^http:\/\// }
      ]
    });

    if (videos.length === 0) {
      console.log("🎉 No insecure URLs found.");
      return;
    }

    console.log(`Found ${videos.length} videos with insecure URLs.`);

    for (const video of videos) {
      let updated = false;

      if (video.videoFile.startsWith("http://")) {
        video.videoFile = video.videoFile.replace("http://", "https://");
        updated = true;
      }

      if (video.thumbnail.startsWith("http://")) {
        video.thumbnail = video.thumbnail.replace("http://", "https://");
        updated = true;
      }

      if (updated) {
        await video.save();
        console.log(`✅ Updated video ${video._id}`);
      }
    }

    console.log("🎯 All insecure URLs fixed.");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    mongoose.disconnect();
  }
};

fixInsecureUrls();
