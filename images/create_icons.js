const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');
const sizes = [16, 48, 128];
async function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#128C7E';
  const radius = size * 0.125;
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
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.7}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('W', size / 2, size / 2);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
  console.log(`Created icon${size}.png`);
}
async function createSimplePlaceholderIcon(size) {
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
function createBasicIcon(size) {
  const width = size;
  const height = size;
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrChunk = Buffer.alloc(25);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4);
  ihdrChunk.writeUInt32BE(width, 8);
  ihdrChunk.writeUInt32BE(height, 12);
  ihdrChunk.writeUInt8(8, 16);
  ihdrChunk.writeUInt8(6, 17);
  ihdrChunk.writeUInt8(0, 18);
  ihdrChunk.writeUInt8(0, 19);
  ihdrChunk.writeUInt8(0, 20);
  const crc = calculateCRC32(ihdrChunk.slice(4, 21));
  ihdrChunk.writeUInt32BE(crc, 21);
  const dataSize = width * height * 4;
  const idatData = Buffer.alloc(dataSize);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      idatData[index] = 18;
      idatData[index + 1] = 140;
      idatData[index + 2] = 126;
      idatData[index + 3] = 255;
    }
  }
  const idatChunk = Buffer.alloc(12 + dataSize);
  idatChunk.writeUInt32BE(dataSize, 0);
  idatChunk.write('IDAT', 4);
  idatData.copy(idatChunk, 8);
  const idatCrc = calculateCRC32(idatChunk.slice(4, 8 + dataSize));
  idatChunk.writeUInt32BE(idatCrc, 8 + dataSize);
  const iendChunk = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  const pngData = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(`icon${size}.png`, pngData);
  console.log(`Created basic icon${size}.png`);
}
function calculateCRC32(data) {
  return 0x00000000;
}
sizes.forEach(size => {
  try {
    createBasicIcon(size);
  } catch (error) {
    console.error(`Failed to create icon${size}.png:`, error);
  }
});
console.log('Icon generation complete.');