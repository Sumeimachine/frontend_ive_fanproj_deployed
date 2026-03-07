/// <reference types="node" />
import fs from "fs";
import axios from "axios";
import "./Dashboard.css";


// Replace with your YouTube Data API key
const YOUTUBE_API_KEY = "AIzaSyAerYqGIIm4AD-kv595jSs5Vpz0Nanscbs";
// The official IVE playlist ID (you can get it from the playlist URL)
const IVE_PLAYLIST_ID = "PLq97QVSGzGPyevF2UoJ-x6cU_8q6IvhkA";



async function fetchIVEPlaylistVideos() {
  let allSongs: { name: string; youtubeId: string }[] = [];
  let nextPageToken = "";

  try {
    do {
const res = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
  params: {
    key: YOUTUBE_API_KEY,
    part: "snippet",
    playlistId: IVE_PLAYLIST_ID,
    maxResults: 50,
    pageToken: nextPageToken
  },
});


      res.data.items.forEach((item: any) => {
        const title: string = item.snippet.title;
        // Optional: filter further if needed
        if (title.toUpperCase().includes("IVE")) {
          allSongs.push({
            name: title,
            youtubeId: item.snippet.resourceId.videoId,
          });
        }
      });

      nextPageToken = res.data.nextPageToken || "";
    } while (nextPageToken);

    // Save to JSON
    const filePath = "src/assets/songs.json";
    fs.writeFileSync(filePath, JSON.stringify(allSongs, null, 2));
    console.log(`Fetched ${allSongs.length} IVE videos! Saved to ${filePath}`);
  } catch (err) {
    console.error("Error fetching videos:", err);
  }
}

fetchIVEPlaylistVideos();