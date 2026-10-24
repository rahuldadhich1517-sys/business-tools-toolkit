import { ValidationError } from '../shared/errors';
import { isValidCssColor } from '../shared/html';
import { serializeSignatureSvg } from './svg';
import type {
  SignaturePadInstance,
  SignaturePadOptions,
  SignaturePoint,
  SignatureStroke,
  SignatureSvgOptions,
} from './types';

export function createSignaturePad(
  canvas: HTMLCanvasElement,
  options: SignaturePadOptions = {}
): SignaturePadInstance {
  if (!canvas || typeof canvas.getContext !== 'function') {
    throw new ValidationError('A valid HTMLCanvasElement must be provided to createSignaturePad');
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ValidationError('Failed to acquire 2D rendering context from the provided canvas');
  }

  let strokeColor = options.strokeColor && isValidCssColor(options.strokeColor) ? options.strokeColor : '#000000';
  let strokeWidth = typeof options.strokeWidth === 'number' && options.strokeWidth > 0 ? options.strokeWidth : 2.5;
  const backgroundColor = options.backgroundColor;

  let strokes: SignatureStroke[] = [];
  let currentStroke: SignaturePoint[] | null = null;
  let isDrawing = false;
  let isDestroyed = false;

  // Apply touch-action css
  if (canvas.style) {
    canvas.style.touchAction = 'none';
  }

  const getCanvasCoords = (e: MouseEvent | Touch | PointerEvent): SignaturePoint => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: Math.round(((e.clientX - rect.left) * scaleX + Number.EPSILON) * 100) / 100,
      y: Math.round(((e.clientY - rect.top) * scaleY + Number.EPSILON) * 100) / 100,
      time: Date.now(),
    };
  };

  const redraw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundColor && backgroundColor !== 'transparent' && isValidCssColor(backgroundColor)) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length === 0) continue;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        const pt = stroke.points[0]!;
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y);
      }
      ctx.stroke();
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (isDestroyed || (e.button !== undefined && e.button !== 0)) return;
    isDrawing = true;
    const pt = getCanvasCoords(e);
    currentStroke = [pt];

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDestroyed || !isDrawing || !currentStroke) return;
    const pt = getCanvasCoords(e);
    const lastPt = currentStroke[currentStroke.length - 1];

    currentStroke.push(pt);

    if (lastPt) {
      ctx.beginPath();
      ctx.moveTo(lastPt.x, lastPt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (isDestroyed || !isDrawing) return;
    isDrawing = false;
    if (currentStroke && currentStroke.length > 0) {
      strokes.push({
        points: currentStroke,
        color: strokeColor,
        width: strokeWidth,
      });
    }
    currentStroke = null;
  };

  const handlePointerCancel = () => {
    if (isDestroyed || !isDrawing) return;
    isDrawing = false;
    currentStroke = null;
    redraw();
  };

  // Add Pointer Event listeners
  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerCancel);

  // Initial draw if background is set
  if (backgroundColor && backgroundColor !== 'transparent') {
    redraw();
  }

  return {
    getSignatureData(): SignatureStroke[] {
      return JSON.parse(JSON.stringify(strokes));
    },

    clearSignature(): void {
      strokes = [];
      currentStroke = null;
      isDrawing = false;
      redraw();
    },

    undoSignature(): void {
      if (strokes.length > 0) {
        strokes.pop();
        redraw();
      }
    },

    isEmpty(): boolean {
      return strokes.length === 0;
    },

    exportSignaturePng(exportOpts?: { backgroundColor?: string }): string {
      if (this.isEmpty()) {
        throw new ValidationError('Cannot export an empty signature');
      }

      const bg = exportOpts?.backgroundColor ?? backgroundColor;
      if (bg && bg !== 'transparent' && isValidCssColor(bg)) {
        // Create an offscreen temporary canvas to render with background
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const offCtx = offscreen.getContext('2d');
        if (offCtx) {
          offCtx.fillStyle = bg;
          offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
          offCtx.drawImage(canvas, 0, 0);
          return offscreen.toDataURL('image/png');
        }
      }
      return canvas.toDataURL('image/png');
    },

    exportSignatureSvg(svgOpts?: SignatureSvgOptions): string {
      return serializeSignatureSvg(strokes, {
        width: canvas.width,
        height: canvas.height,
        backgroundColor,
        ...svgOpts,
      });
    },

    setStrokeColor(color: string): void {
      if (isValidCssColor(color)) {
        strokeColor = color;
      }
    },

    setStrokeWidth(width: number): void {
      if (Number.isFinite(width) && width > 0) {
        strokeWidth = width;
      }
    },

    destroy(): void {
      if (isDestroyed) return;
      isDestroyed = true;
      isDrawing = false;
      currentStroke = null;

      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    },
  };
}
