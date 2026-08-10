// Frame-accurate video export. Primary path uses WebCodecs VideoEncoder + a muxer
// (mp4-muxer / webm-muxer), rendering each frame offscreen — faster than realtime,
// arbitrary resolution/fps, and seamless loops (frame N maps to t=1==t=0).
// Falls back to MediaRecorder (realtime, WebM only) when WebCodecs is unavailable.

import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from 'mp4-muxer';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from 'webm-muxer';

export function webCodecsAvailable() {
  return typeof window !== 'undefined' && 'VideoEncoder' in window;
}

function pickBitrate(w, h, fps) {
  return Math.min(45_000_000, Math.round(w * h * fps * 0.14));
}

async function firstSupportedCodec(candidates, w, h, fps) {
  for (const codec of candidates) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({
        codec,
        width: w,
        height: h,
        framerate: fps,
      });
      if (supported) return codec;
    } catch {
      /* try next */
    }
  }
  return null;
}

// Main export. Returns a Blob.
export async function exportVideo({
  drawScene,
  width,
  height,
  fps = 30,
  duration = 4,
  format = 'mp4', // 'mp4' | 'webm'
  transparent = false,
  onProgress = () => {},
}) {
  // even dimensions required by most codecs
  width = Math.round(width / 2) * 2;
  height = Math.round(height / 2) * 2;
  const totalFrames = Math.max(1, Math.round(fps * duration));

  // Ensure web fonts (e.g. Arabic faces) are loaded before rendering any frame,
  // otherwise the first frames would fall back to a system font.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* proceed with whatever is loaded */
    }
  }

  if (webCodecsAvailable()) {
    try {
      return await encodeWithWebCodecs({
        drawScene,
        width,
        height,
        fps,
        totalFrames,
        format,
        transparent,
        onProgress,
      });
    } catch (err) {
      console.warn('WebCodecs export failed, falling back to MediaRecorder:', err);
    }
  }
  // Fallback (WebM realtime only)
  return await encodeWithMediaRecorder({
    drawScene,
    width,
    height,
    fps,
    duration,
    onProgress,
  });
}

async function encodeWithWebCodecs({
  drawScene,
  width,
  height,
  fps,
  totalFrames,
  format,
  transparent,
  onProgress,
}) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { alpha: true });

  let muxer, codec, muxerCodecName;
  if (format === 'webm') {
    codec = await firstSupportedCodec(
      ['vp09.00.10.08', 'vp8'],
      width,
      height,
      fps
    );
    if (!codec) throw new Error('No supported WebM codec');
    muxerCodecName = codec.startsWith('vp09') ? 'V_VP9' : 'V_VP8';
    muxer = new WebmMuxer({
      target: new WebmTarget(),
      video: {
        codec: muxerCodecName,
        width,
        height,
        frameRate: fps,
        alpha: !!transparent,
      },
    });
  } else {
    codec = await firstSupportedCodec(
      ['avc1.640028', 'avc1.64001f', 'avc1.4d0028', 'avc1.42001f'],
      width,
      height,
      fps
    );
    if (!codec) throw new Error('No supported H.264 codec');
    muxer = new Mp4Muxer({
      target: new Mp4Target(),
      video: { codec: 'avc', width, height },
      fastStart: 'in-memory',
    });
  }

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      throw e;
    },
  });

  const config = {
    codec,
    width,
    height,
    bitrate: pickBitrate(width, height, fps),
    framerate: fps,
  };
  if (format === 'webm' && transparent) config.alpha = 'keep';
  encoder.configure(config);

  const frameDur = 1_000_000 / fps; // microseconds
  for (let i = 0; i < totalFrames; i++) {
    const t = i / totalFrames; // seamless: i=totalFrames would equal i=0
    drawScene(ctx, width, height, t);
    const frame = new VideoFrame(canvas, {
      timestamp: Math.round(i * frameDur),
      duration: Math.round(frameDur),
      alpha: transparent ? 'keep' : 'discard',
    });
    encoder.encode(frame, { keyFrame: i % Math.round(fps) === 0 });
    frame.close();
    onProgress((i + 1) / totalFrames);
    // relieve backpressure
    if (encoder.encodeQueueSize > 8) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  await encoder.flush();
  muxer.finalize();
  const { buffer } = muxer.target;
  const mime = format === 'webm' ? 'video/webm' : 'video/mp4';
  return new Blob([buffer], { type: mime });
}

async function encodeWithMediaRecorder({
  drawScene,
  width,
  height,
  fps,
  duration,
  onProgress,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream(fps);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const rec = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: pickBitrate(width, height, fps),
  });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  return await new Promise((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    rec.start();
    const start = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const t = (elapsed % duration) / duration;
      drawScene(ctx, width, height, t);
      onProgress(Math.min(1, elapsed / duration));
      if (elapsed >= duration) {
        rec.stop();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}
