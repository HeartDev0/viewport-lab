import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDir = path.join(root, "assets");
const artifactDir = "C:\\Users\\junio\\.gemini\\antigravity\\brain\\048cf293-a34c-4e76-811b-85aabb4a624a";

const backdropHtml = path.join(root, "tools", "social-backdrop-9-16.html");
const backdropPng = path.join(root, "tools", "social_backdrop.png");
const inputVideo = path.join(root, "assets", "viewport-lab-demo.mp4");

const outputMp4 = path.join(outputDir, "viewport-lab-social-promo.mp4");
const outputGif = path.join(outputDir, "viewport-lab-social-promo.gif");
const artifactMp4 = path.join(artifactDir, "viewport-lab-social-promo.mp4");
const artifactGif = path.join(artifactDir, "viewport-lab-social-promo.gif");

console.log("1. Rendering high-resolution 1080x1920 social backdrop with Edge...");
execFileSync(edgePath, [
  "--headless",
  `--screenshot=${backdropPng}`,
  "--window-size=1080,1920",
  "--hide-scrollbars",
  "--disable-gpu",
  `file:///${backdropHtml.replace(/\\/g, "/")}`
]);
console.log(`Backdrop rendered: ${backdropPng} (${fs.statSync(backdropPng).size} bytes)`);

// Video slot geometry: x=30, y=670, width=1020, height=582 (1020 * 808 / 1416 = 582)
console.log("2. Compositing video into 1080x1920 vertical canvas with ffmpeg...");
execFileSync("ffmpeg", [
  "-y",
  "-loop", "1",
  "-i", backdropPng,
  "-i", inputVideo,
  "-filter_complex",
  "[1:v]scale=1020:582:flags=lanczos,format=yuva420p[vid];[0:v][vid]overlay=x=30:y=675:shortest=1[outv]",
  "-map", "[outv]",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-crf", "18",
  "-preset", "medium",
  "-movflags", "+faststart",
  outputMp4
]);
console.log(`Social MP4 generated: ${outputMp4} (${fs.statSync(outputMp4).size} bytes)`);
fs.copyFileSync(outputMp4, artifactMp4);

console.log("3. Generating mobile social preview GIF (480x854 @ 16fps)...");
execFileSync("ffmpeg", [
  "-y",
  "-i", outputMp4,
  "-vf", "fps=16,scale=480:854:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
  outputGif
]);
console.log(`Social GIF generated: ${outputGif} (${fs.statSync(outputGif).size} bytes)`);
fs.copyFileSync(outputGif, artifactGif);

try { fs.unlinkSync(backdropPng); } catch {}
console.log("All social promo assets built successfully!");
