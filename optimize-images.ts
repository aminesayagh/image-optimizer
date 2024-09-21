import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const inputDir = path.join(__dirname, "../cover");
const outputDir = path.join(__dirname, "../optimized-cover");

const imageSizes: {
  [key: number]: { sizes: number[]; aspectRatio: number; placeholders: string };
} = {};

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir); // Create output directory
}

const imageWidths = [390, 475, 640, 768, 900, 1024, 1280, 1536, 1600, 1920];
const outputFormats = ["webp", "avif"]; // Add AVIF format
const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];

async function processImages() {
  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    const inputFilePath = path.join(inputDir, file);
    const fileExt = path.extname(file).toLowerCase();
    const fileName = path.basename(file, fileExt);
    const fileNumber = parseInt(fileName.split("-")[3]);

    // Only process image files
    if (validExtensions.includes(fileExt)) {
      const baseName = path.basename(file, fileExt);

      // Read the image metadata to check dimensions
      const metadata = await sharp(inputFilePath).metadata();
      const aspectRatio = metadata.width! / metadata.height!;

      // Resize if width is greater than 1920px
      const width =
        metadata.width && metadata.width > 1920 ? 1920 : metadata.width;

      // Process for each defined width
      const validWidths = imageWidths.filter(w => w <= width!);
      for (const w of validWidths) {
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

      const placeholderPath = path.join(
        outputDir,
        `${baseName}-placeholder.webp`
      );
      const placeholderBuffer = await sharp(inputFilePath)
        .resize({ width: 20 })
        .webp({ quality: 50 })
        .blur()
        .toBuffer();

      fs.writeFileSync(placeholderPath, placeholderBuffer);

      const base64Placeholder = `data:image/webp;base64,${placeholderBuffer.toString("base64")}`;
      imageSizes[fileNumber] = {
        sizes: imageWidths.filter(w => w <= width!),
        aspectRatio,
        placeholders: base64Placeholder
      };
    }
  }
}

processImages()
  .then(() => {
    // Write imageSizes and placeholders to JSON files
    fs.writeFileSync(
      path.join(outputDir, "image-sizes.json"),
      JSON.stringify(imageSizes, null, 2)
    );
  })
  .catch(err => {
    console.error("Error processing images:", err);
  });
