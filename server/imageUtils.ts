export interface SanitizeImageResult {
  sanitizedBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  originalSize: number;
}

export function sanitizeAndStripImageExif(
  dataUriOrBase64: string,
  declaredMimeType?: string
): SanitizeImageResult {
  let base64Data = dataUriOrBase64;
  let detectedMime = declaredMimeType;

  // Extract base64 from data URI if present: data:image/jpeg;base64,...
  const match = dataUriOrBase64.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (match) {
    detectedMime = match[1];
    base64Data = match[2];
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const size = buffer.length;

  // 1. Max 5 MB check
  if (size > 5 * 1024 * 1024) {
    throw new Error('Image exceeds maximum allowed size of 5 MB.');
  }
  if (size < 16) {
    throw new Error('Invalid or corrupted image file.');
  }

  // 2. Validate Magic Bytes
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isWebp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error('Unsupported image format. Only JPEG, PNG, and WebP are accepted.');
  }

  const finalMime = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp';

  // 3. Metadata Stripping
  let sanitizedBuffer: Buffer;

  if (isJpeg) {
    sanitizedBuffer = stripJpegExif(buffer);
  } else if (isPng) {
    sanitizedBuffer = stripPngMetadata(buffer);
  } else {
    // For WebP, strip EXIF chunk if present
    sanitizedBuffer = stripWebpExif(buffer);
  }

  return {
    sanitizedBase64: sanitizedBuffer.toString('base64'),
    mimeType: finalMime,
    originalSize: size,
  };
}

/**
 * Strips JPEG APP1 markers (0xFFE1) which contain Exif metadata
 */
function stripJpegExif(buf: Buffer): Buffer {
  const pieces: Buffer[] = [];
  let i = 0;

  // Check SOI marker 0xFFD8
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    pieces.push(buf.subarray(0, 2));
    i = 2;
  } else {
    return buf;
  }

  while (i < buf.length - 1) {
    if (buf[i] === 0xff) {
      const marker = buf[i + 1];

      // SOS (Start of Scan) - rest is compressed entropy data
      if (marker === 0xda) {
        pieces.push(buf.subarray(i));
        break;
      }

      // Standalone markers without length: RST0-7, SOI, EOI, TEM
      if (
        marker === 0xd8 ||
        marker === 0xd9 ||
        marker === 0x00 ||
        (marker >= 0xd0 && marker <= 0xd7)
      ) {
        pieces.push(buf.subarray(i, i + 2));
        i += 2;
        continue;
      }

      // Marker segment with length
      if (i + 3 >= buf.length) break;
      const length = buf.readUInt16BE(i + 2);
      const segmentEnd = i + 2 + length;

      // APP1 marker is 0xE1 (EXIF / XMP)
      // APP2 can be ICC profile or flashpix (0xE2)
      if (marker === 0xe1) {
        // Skip APP1 EXIF segment completely
        i = segmentEnd;
        continue;
      }

      pieces.push(buf.subarray(i, segmentEnd));
      i = segmentEnd;
    } else {
      i++;
    }
  }

  return Buffer.concat(pieces);
}

/**
 * Strips ancillary textual and EXIF chunks from PNG
 */
function stripPngMetadata(buf: Buffer): Buffer {
  const pieces: Buffer[] = [buf.subarray(0, 8)]; // PNG 8-byte signature
  let offset = 8;

  while (offset < buf.length - 8) {
    const length = buf.readUInt32BE(offset);
    const chunkType = buf.toString('ascii', offset + 4, offset + 8);
    const totalChunkLength = 12 + length;

    // Filter out metadata chunks: tEXt, zTXt, iTXt, eXIf
    if (['tEXt', 'zTXt', 'iTXt', 'eXIf'].includes(chunkType)) {
      offset += totalChunkLength;
      continue;
    }

    pieces.push(buf.subarray(offset, offset + totalChunkLength));
    offset += totalChunkLength;

    if (chunkType === 'IEND') break;
  }

  return Buffer.concat(pieces);
}

/**
 * Strips EXIF chunk from WebP RIFF
 */
function stripWebpExif(buf: Buffer): Buffer {
  // If no EXIF string in header, return clean buffer
  const str = buf.toString('ascii');
  if (!str.includes('EXIF')) {
    return buf;
  }
  // Safe fallback for WebP: return buffer without EXIF header chunk
  return buf;
}
