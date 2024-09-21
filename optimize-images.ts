import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const inputDir = path.join(__dirname, "../cover");
const outputDir = path.join(__dirname, "../optimized-cover");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir); // Create output directory
}

const imageWidths = [390, 475, 640, 768, 900, 1024, 1280, 1536, 1600, 2100];
const outputFormats = ["webp", "avif"]; // Add AVIF format
const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];

async function processImages() {
  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    const inputFilePath = path.join(inputDir, file);
    const fileExt = path.extname(file).toLowerCase();

    // Only process image files
    if (validExtensions.includes(fileExt)) {
      const baseName = path.basename(file, fileExt);

      // Read the image metadata to check dimensions
      const metadata = await sharp(inputFilePath).metadata();

      // Resize if width is greater than 1920px
      const width =
        metadata.width && metadata.width > 1920 ? 1920 : metadata.width;

      // Process for each defined width
      for (const w of imageWidths) {
        if (w <= width!) {
          for (const format of outputFormats) {
            const outputFilePath = path.join(
              outputDir,
              `${baseName}-${w}.${format}`
            );

            const transformer = sharp(inputFilePath).resize({ width: w });

            if (format === "webp") {
              transformer.webp({ quality: 75 });
            } else if (format === "avif") {
              transformer.avif({ quality: 50 });
            }

            await transformer.toFile(outputFilePath);

            console.log(`Generated ${outputFilePath}`);
          }
        }
      }

      // Generate placeholder image
      const placeholderPath = path.join(
        outputDir,
        `${baseName}-placeholder.webp`
      );
      await sharp(inputFilePath)
        .resize({ width: 20 })
        .webp({ quality: 50 })
        .blur()
        .toFile(placeholderPath);

      console.log(`Generated placeholder ${placeholderPath}`);
    }
  }
}

processImages().catch(err => {
  console.error("Error processing images:", err);
});
