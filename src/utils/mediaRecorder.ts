// src/utils/mediaRecorder.ts
// Utilities for screenshot and video capture from the visualizer canvas

/**
 * Capture a still frame from the canvas and download it as a PNG.
 */
export function takeScreenshot(canvas: HTMLCanvasElement): void {
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `acoustic-visualizer-${Date.now()}.png`;
  link.href = dataURL;
  link.click();
}

/** Internal recorder state */
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

/**
 * Start recording the canvas to a WebM video.
 * Captures at 60 fps using canvas.captureStream().
 *
 * @param canvas - The visualizer canvas element
 * @returns true if recording started successfully
 */
export function startRecording(canvas: HTMLCanvasElement): boolean {
  if (mediaRecorder && mediaRecorder.state === 'recording') return false;

  try {
    const stream = canvas.captureStream(60);
    recordedChunks = [];

    // Prefer VP9 for better quality; fall back to VP8 or default
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `acoustic-visualizer-${Date.now()}.webm`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      recordedChunks = [];
    };

    // Collect data every 100ms for smooth recording
    mediaRecorder.start(100);
    return true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    return false;
  }
}

/**
 * Stop the active recording and trigger a download of the video file.
 */
export function stopRecording(): void {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    mediaRecorder = null;
  }
}

export function isRecording(): boolean {
  return mediaRecorder !== null && mediaRecorder.state === 'recording';
}
