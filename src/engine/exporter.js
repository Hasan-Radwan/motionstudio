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
  audio = null, // { blob, volume } — muxed as a looped track (WebCodecs path only)
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
        audio,
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
  audio,
  onProgress,
}) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { alpha: true });

  // Pre-encode the audio (if any) BEFORE building the muxer, so the muxer can be
  // configured with the right audio params. Failure degrades to video-only.
  let audioTrack = null;
  if (audio && audio.blob) {
    try {
      audioTrack = await preEncodeAudio({
        blob: audio.blob,
        volume: audio.volume,
        format,
        duration: totalFrames / fps,
      });
    } catch (err) {
      console.warn('Audio encode failed — exporting without audio:', err);
      audioTrack = null;
    }
  }

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
      ...(audioTrack && {
        audio: {
          codec: 'A_OPUS',
          numberOfChannels: audioTrack.numberOfChannels,
          sampleRate: audioTrack.sampleRate,
        },
      }),
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
      ...(audioTrack && {
        audio: {
          codec: 'aac',
          numberOfChannels: audioTrack.numberOfChannels,
          sampleRate: audioTrack.sampleRate,
        },
      }),
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

  // Mux the pre-encoded audio chunks (muxers sort by timestamp on finalize).
  if (audioTrack) {
    for (const { chunk, meta } of audioTrack.chunks) muxer.addAudioChunk(chunk, meta);
  }

  muxer.finalize();
  const { buffer } = muxer.target;
  const mime = format === 'webm' ? 'video/webm' : 'video/mp4';
  return new Blob([buffer], { type: mime });
}

// Decode an audio blob, loop/trim it to `duration` seconds (with volume gain),
// and encode it to AAC (mp4) or Opus (webm). Returns { numberOfChannels,
// sampleRate, chunks:[{chunk, meta}] } or throws.
async function preEncodeAudio({ blob, volume = 100, format, duration }) {
  if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') {
    throw new Error('AudioEncoder unavailable');
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  const sampleRate = 48000; // normalize so AAC + Opus both work
  const actx = new AC({ sampleRate });
  let buf;
  try {
    buf = await actx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    actx.close?.();
  }

  const channels = Math.min(2, buf.numberOfChannels || 1);
  const gain = Math.max(0, Math.min(1, (volume ?? 100) / 100));
  const totalFrames = Math.round(duration * sampleRate);
  const srcLen = buf.length;
  const src = [];
  for (let c = 0; c < channels; c++) src.push(buf.getChannelData(Math.min(c, buf.numberOfChannels - 1)));

  const chunks = [];
  const codec = format === 'webm' ? 'opus' : 'mp4a.40.2';
  const encoder = new AudioEncoder({
    output: (chunk, meta) => chunks.push({ chunk, meta }),
    error: (e) => {
      throw e;
    },
  });
  encoder.configure({ codec, sampleRate, numberOfChannels: channels, bitrate: 128_000 });

  const block = 2048; // frames per AudioData
  const usPerFrame = 1_000_000 / sampleRate;
  for (let pos = 0; pos < totalFrames; pos += block) {
    const n = Math.min(block, totalFrames - pos);
    const data = new Float32Array(n * channels); // planar layout
    for (let c = 0; c < channels; c++) {
      const ch = src[c];
      const off = c * n;
      for (let i = 0; i < n; i++) data[off + i] = ch[(pos + i) % srcLen] * gain;
    }
    const frame = new AudioData({
      format: 'f32-planar',
      sampleRate,
      numberOfFrames: n,
      numberOfChannels: channels,
      timestamp: Math.round(pos * usPerFrame),
      data,
    });
    encoder.encode(frame);
    frame.close();
    if (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 0));
  }
  await encoder.flush();
  encoder.close();
  return { numberOfChannels: channels, sampleRate, chunks };
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
