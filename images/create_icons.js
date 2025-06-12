const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

// Sizes for the icons
const sizes = [16, 48, 128];

// Create a colored square for each size (as a temporary solution)
async function createIcon(size) {
  // Create a canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw a rounded rectangle with WhatsApp green color
  ctx.fillStyle = '#128C7E';
  
  // Create rounded rectangle
  const radius = size * 0.125; // Radius is 1/8 of the icon size
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Draw a "W" in white
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.7}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('W', size / 2, size / 2);
  
  // Output as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
  console.log(`Created icon${size}.png`);
}

// Alternative: create simple placeholder icons
async function createSimplePlaceholderIcon(size) {
  // Create a buffer with a solid color square
  const buffer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#128C7E" rx="${size*0.125}" ry="${size*0.125}" />
      <text x="${size/2}" y="${size/2}" font-family="Arial" font-size="${size*0.7}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">W</text>
    </svg>
  `);
  
  try {
    await sharp(buffer)
      .png()
      .toFile(`icon${size}.png`);
    console.log(`Created icon${size}.png`);
  } catch (error) {
    console.error(`Error creating icon${size}.png:`, error);
  }
}

// Since we might not have canvas/sharp available, let's create very basic icons
function createBasicIcon(size) {
  // Create a simple colored PNG
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (image header)
  const ihdrChunk = Buffer.alloc(25);
  ihdrChunk.writeUInt32BE(13, 0); // Length of chunk data
  ihdrChunk.write('IHDR', 4); // Chunk type
  ihdrChunk.writeUInt32BE(width, 8); // Width
  ihdrChunk.writeUInt32BE(height, 12); // Height
  ihdrChunk.writeUInt8(8, 16); // Bit depth
  ihdrChunk.writeUInt8(6, 17); // Color type (6 = truecolor with alpha)
  ihdrChunk.writeUInt8(0, 18); // Compression method
  ihdrChunk.writeUInt8(0, 19); // Filter method
  ihdrChunk.writeUInt8(0, 20); // Interlace method
  
  // Calculate CRC32 for IHDR
  const crc = calculateCRC32(ihdrChunk.slice(4, 21));
  ihdrChunk.writeUInt32BE(crc, 21);
  
  // Create a simple green square with transparency
  const dataSize = width * height * 4; // 4 bytes per pixel (RGBA)
  const idatData = Buffer.alloc(dataSize);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // WhatsApp green color (18, 140, 126)
      idatData[index] = 18;     // R
      idatData[index + 1] = 140; // G
      idatData[index + 2] = 126; // B
      idatData[index + 3] = 255; // Alpha
    }
  }
  
  // IDAT chunk (image data)
  const idatChunk = Buffer.alloc(12 + dataSize);
  idatChunk.writeUInt32BE(dataSize, 0); // Length of chunk data
  idatChunk.write('IDAT', 4); // Chunk type
  idatData.copy(idatChunk, 8);
  
  // Calculate CRC32 for IDAT
  const idatCrc = calculateCRC32(idatChunk.slice(4, 8 + dataSize));
  idatChunk.writeUInt32BE(idatCrc, 8 + dataSize);
  
  // IEND chunk (image end)
  const iendChunk = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  
  // Combine all parts to create the PNG file
  const pngData = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  
  // Write to file
  fs.writeFileSync(`icon${size}.png`, pngData);
  console.log(`Created basic icon${size}.png`);
}

// Placeholder function for CRC32 calculation (simplified for this example)
function calculateCRC32(data) {
  // This is a simplified CRC32 implementation
  return 0x00000000;
}

// Execute for each size
sizes.forEach(size => {
  try {
    createBasicIcon(size);
  } catch (error) {
    console.error(`Failed to create icon${size}.png:`, error);
  }
});

console.log('Icon generation complete.'); 