import type { CollatzSequence } from "./collatz";

interface DrawMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function catmullRomPath(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[]
) {
  if (pts.length === 0) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

export function drawChartFrame(
  ctx: CanvasRenderingContext2D,
  sequences: CollatzSequence[],
  currentTermFloat: number,
  canvasWidth: number,
  canvasHeight: number,
  maxTerms: number,
  displayMax: number,
  gridInterval: number
) {
  const m: DrawMargins = { top: 48, right: 48, bottom: 64, left: 80 };
  const plotW = canvasWidth - m.left - m.right;
  const plotH = canvasHeight - m.top - m.bottom;

  // Background
  ctx.fillStyle = "#080b0f";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const toX = (term: number) => m.left + (term / Math.max(maxTerms - 1, 1)) * plotW;
  const toY = (val: number) => m.top + plotH - (val / Math.max(displayMax, 1)) * plotH;

  // Subtle grid lines
  ctx.lineWidth = 1;
  for (let t = 0; t <= maxTerms; t += gridInterval) {
    const x = toX(t);
    ctx.strokeStyle = "rgba(100,150,255,0.07)";
    ctx.beginPath();
    ctx.moveTo(x, m.top);
    ctx.lineTo(x, m.top + plotH);
    ctx.stroke();
  }

  // Y grid lines (5 intervals)
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = m.top + (i / ySteps) * plotH;
    ctx.strokeStyle = "rgba(100,150,255,0.07)";
    ctx.beginPath();
    ctx.moveTo(m.left, y);
    ctx.lineTo(m.left + plotW, y);
    ctx.stroke();
    // Y labels
    const val = Math.round(((ySteps - i) / ySteps) * displayMax);
    ctx.fillStyle = "rgba(140,180,220,0.5)";
    ctx.font = "11px JetBrains Mono, monospace";
    ctx.textAlign = "right";
    ctx.fillText(val.toLocaleString(), m.left - 10, y + 4);
  }

  // X axis labels
  const labelInterval = Math.max(gridInterval, Math.ceil((maxTerms / 8) / gridInterval) * gridInterval);
  ctx.fillStyle = "rgba(140,180,220,0.5)";
  ctx.font = "11px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  for (let t = 0; t <= maxTerms; t += labelInterval) {
    const x = toX(t);
    ctx.fillText(t.toString(), x, m.top + plotH + 22);
  }

  // Axis lines
  ctx.strokeStyle = "rgba(100,150,255,0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m.left, m.top);
  ctx.lineTo(m.left, m.top + plotH);
  ctx.lineTo(m.left + plotW, m.top + plotH);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = "rgba(140,180,220,0.4)";
  ctx.font = "12px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.fillText("Term", m.left + plotW / 2, m.top + plotH + 46);
  ctx.save();
  ctx.translate(m.left - 55, m.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Value", 0, 0);
  ctx.restore();

  // Draw sequences
  const currentTermInt = Math.floor(currentTermFloat);
  const tFrac = currentTermFloat - currentTermInt;

  sequences.forEach((seq) => {
    if (seq.values.length === 0) return;
    const endTerm = Math.min(currentTermInt, seq.values.length - 1);
    if (endTerm < 0) return;

    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= endTerm; i++) {
      pts.push({ x: toX(i), y: toY(seq.values[i]) });
    }
    if (endTerm + 1 < seq.values.length && tFrac > 0) {
      const yInterp =
        seq.values[endTerm] +
        (seq.values[endTerm + 1] - seq.values[endTerm]) * tFrac;
      pts.push({ x: toX(endTerm + tFrac), y: toY(yInterp) });
    }

    // Glow effect
    ctx.shadowColor = seq.color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = seq.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    catmullRomPath(ctx, pts);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dot at current position
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      ctx.fillStyle = seq.color;
      ctx.shadowColor = seq.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });

  // Title / legend
  ctx.font = "bold 13px JetBrains Mono, monospace";
  ctx.textAlign = "left";
  let legendX = m.left;
  sequences.forEach((seq) => {
    ctx.fillStyle = seq.color;
    ctx.fillRect(legendX, 14, 20, 3);
    ctx.fillStyle = "rgba(200,220,255,0.7)";
    ctx.font = "12px JetBrains Mono, monospace";
    const label = `n=${seq.startingNumber}`;
    ctx.fillText(label, legendX + 26, 20);
    legendX += ctx.measureText(label).width + 52;
  });
}

export async function renderStaticChart(
  sequences: CollatzSequence[],
  width = 1200,
  height = 700
): Promise<HTMLCanvasElement> {
  const { getGridInterval } = await import("./collatz");
  const maxTerms = Math.max(...sequences.map((s) => s.values.length), 1);
  const maxVal = Math.max(...sequences.flatMap((s) => s.values), 1);
  const gridInterval = getGridInterval(maxTerms);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  drawChartFrame(
    ctx,
    sequences,
    maxTerms - 1,
    width,
    height,
    maxTerms,
    maxVal * 1.08,
    gridInterval
  );
  return canvas;
}

export async function exportVideo(
  sequences: CollatzSequence[],
  onProgress: (pct: number) => void
): Promise<Blob> {
  const { getGridInterval, getSecondsPerTerm } = await import("./collatz");
  const maxTerms = Math.max(...sequences.map((s) => s.values.length), 2);
  const secsPerTerm = getSecondsPerTerm(maxTerms);
  const gridInterval = getGridInterval(maxTerms);

  const FPS = 30;
  const framesPerTerm = Math.max(1, Math.round(secsPerTerm * FPS));
  const totalFrames = (maxTerms - 1) * framesPerTerm + FPS; // +1s hold at end

  const W = 1280;
  const H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
    ? "video/mp4;codecs=avc1"
    : MediaRecorder.isTypeSupported("video/mp4")
    ? "video/mp4"
    : "video/webm;codecs=vp9";

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  recorder.start();

  let displayMax = 1;
  const allMax = Math.max(...sequences.flatMap((s) => s.values), 1);

  const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm";

  await new Promise<void>((resolve) => {
    let frame = 0;
    function renderFrame() {
      if (frame >= totalFrames) {
        recorder.stop();
        recorder.onstop = () => resolve();
        return;
      }

      const termFloat =
        frame < (maxTerms - 1) * framesPerTerm
          ? frame / framesPerTerm
          : maxTerms - 1;

      // Smoothly grow displayMax
      const termInt = Math.floor(termFloat);
      const runningMax = Math.max(
        ...sequences.map((s) => Math.max(...s.values.slice(0, termInt + 2), 1)),
        1
      );
      displayMax = Math.max(displayMax, runningMax * 1.08);
      // Smooth scale lerp
      const targetMax = Math.min(runningMax * 1.12, allMax * 1.08);
      displayMax = displayMax * 0.97 + targetMax * 0.03;

      drawChartFrame(ctx, sequences, termFloat, W, H, maxTerms, displayMax, gridInterval);
      onProgress(frame / totalFrames);
      frame++;
      requestAnimationFrame(renderFrame);
    }
    renderFrame();
  });

  const finalType = mimeType.startsWith("video/mp4") ? "video/mp4" : "video/webm";
  return new Blob(chunks, { type: finalType });
}
