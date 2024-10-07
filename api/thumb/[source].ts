// GET /thumb/profile.png?width=300&height=300
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { head, put } from '@vercel/blob';
import sharp from 'sharp';
const maxSize = 1000;

const getBuffer = async (url) => {  
  const response = await fetch(url);
  if (!response.ok) {
    return;
  }
  
  const buffers = [];
  for await (const data of response.body) {
    buffers.push(data);
  }

  const buffer = Buffer.concat(buffers);
  return buffer;
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { source, width, height } = req.query;
  if(!source || !width || !height) {
    return res.status(400).send('source, width and height are required');
  }

  if(parseInt(width as string) > maxSize || parseInt(height as string) > maxSize) {
    return res.status(400).send(`Width and height must be less than ${maxSize}`);
  }

  const thumbUrl = `${process.env.BASE_URL}/${width}x${height}/${source}`;
  try {
    const thumb = await head(thumbUrl);
    if(thumb) {
      const thumbBuffer = await getBuffer(thumbUrl);
      if(thumbBuffer) {
        res.setHeader('Content-Type', 'image/png');
        return res.send(thumbBuffer);
      }
    }
  } catch {
  }
  const imageUrl = `${process.env.BASE_URL}/${source}`;
  const imageBuffer = await getBuffer(imageUrl);
  if(!imageBuffer) {
    return res.status(404).send('Image not found');
  }

  const resizedImage = await sharp(imageBuffer)
    .resize(parseInt(width as string), parseInt(height as string))
    .toBuffer();

  await put(`${width}x${height}/${source}`, resizedImage, { contentType: 'image/png', access: 'public' });
  res.setHeader('Content-Type', 'image/png');
  res.send(resizedImage);
}
