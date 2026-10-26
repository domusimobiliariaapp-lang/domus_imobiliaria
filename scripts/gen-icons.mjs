import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function run() {
  const pub = path.resolve('public');
  const svg512 = fs.readFileSync(path.join(pub, 'pwa-512x512.svg'));
  const svg192 = fs.readFileSync(path.join(pub, 'pwa-192x192.svg'));
  const svgMask = fs.readFileSync(path.join(pub, 'pwa-maskable-512x512.svg'));

  await sharp(svg512).resize(512, 512).png().toFile(path.join(pub, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  await sharp(svg192).resize(192, 192).png().toFile(path.join(pub, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  await sharp(svgMask).resize(512, 512).png().toFile(path.join(pub, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  await sharp(svg512).resize(180, 180).png().toFile(path.join(pub, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  await sharp(svg512).resize(32, 32).png().toFile(path.join(pub, 'favicon-32x32.png'));
  console.log('Generated favicon-32x32.png');

  await sharp(svg512).resize(16, 16).png().toFile(path.join(pub, 'favicon-16x16.png'));
  console.log('Generated favicon-16x16.png');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
