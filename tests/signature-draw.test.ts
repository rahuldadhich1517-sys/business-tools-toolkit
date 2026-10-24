import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../src/shared/errors';
import { createSignaturePad, serializeSignatureSvg } from '../src/signature-draw';

describe('Handwritten Signature Capture', () => {
  describe('serializeSignatureSvg (Headless SVG Serializer)', () => {
    it('returns empty SVG when no strokes are present', () => {
      const svg = serializeSignatureSvg([]);
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).not.toContain('<path');
    });

    it('serializes single-point stroke as a circle', () => {
      const strokes = [
        {
          points: [{ x: 50, y: 50 }],
          color: '#000000',
          width: 3,
        },
      ];
      const svg = serializeSignatureSvg(strokes);
      expect(svg).toContain('<circle cx="50" cy="50" r="1.5" fill="#000000" />');
    });

    it('serializes multi-point strokes as SVG paths with validated coordinates', () => {
      const strokes = [
        {
          points: [
            { x: 10, y: 20 },
            { x: 30, y: 40 },
            { x: 50, y: 60 },
          ],
          color: '#1d4ed8',
          width: 2,
        },
      ];
      const svg = serializeSignatureSvg(strokes);
      expect(svg).toContain('<path d="M 10 20 L 30 40 L 50 60" fill="none" stroke="#1d4ed8" stroke-width="2"');
    });

    it('renders optional background rect when specified', () => {
      const strokes = [{ points: [{ x: 5, y: 5 }], color: '#000', width: 2 }];
      const svg = serializeSignatureSvg(strokes, { backgroundColor: '#f0f0f0' });
      expect(svg).toContain('<rect width="');
      expect(svg).toContain('fill="#f0f0f0"');
    });

    it('filters out non-finite coordinates preventing XML injection', () => {
      const dangerousStrokes = [
        {
          points: [
            { x: NaN, y: 20 },
            { x: 10, y: Infinity },
            { x: 15, y: 25 },
          ],
          color: '#000',
          width: 2,
        },
      ];
      const svg = serializeSignatureSvg(dangerousStrokes);
      expect(svg).not.toContain('NaN');
      expect(svg).not.toContain('Infinity');
    });
  });

  describe('createSignaturePad (Interactive Signature Pad)', () => {
    function createMockCanvas() {
      const listeners: Record<string, Function[]> = {};
      const ctx = {
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        strokeStyle: '#000000',
        fillStyle: '#000000',
        lineWidth: 1,
        lineCap: 'round',
        lineJoin: 'round',
      };

      const canvas = {
        width: 300,
        height: 150,
        style: {} as Record<string, string>,
        getContext: vi.fn().mockReturnValue(ctx),
        getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0, width: 300, height: 150 }),
        addEventListener: vi.fn((event: string, handler: Function) => {
          listeners[event] = listeners[event] || [];
          listeners[event]!.push(handler);
        }),
        removeEventListener: vi.fn((event: string, handler: Function) => {
          if (listeners[event]) {
            listeners[event] = listeners[event]!.filter((h) => h !== handler);
          }
        }),
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,MOCK_PNG_DATA'),
      };

      // Mock global window event listeners
      const windowListeners: Record<string, Function[]> = {};
      const origWindow = globalThis.window;
      // @ts-expect-error test mock
      globalThis.window = {
        addEventListener: vi.fn((event: string, handler: Function) => {
          windowListeners[event] = windowListeners[event] || [];
          windowListeners[event]!.push(handler);
        }),
        removeEventListener: vi.fn((event: string, handler: Function) => {
          if (windowListeners[event]) {
            windowListeners[event] = windowListeners[event]!.filter((h) => h !== handler);
          }
        }),
      };

      return {
        canvas: canvas as unknown as HTMLCanvasElement,
        ctx,
        listeners,
        windowListeners,
        restore: () => {
          globalThis.window = origWindow;
        },
      };
    }

    it('throws if invalid canvas is provided', () => {
      // @ts-expect-error invalid canvas
      expect(() => createSignaturePad(null)).toThrow(ValidationError);
      // @ts-expect-error invalid canvas
      expect(() => createSignaturePad({})).toThrow(ValidationError);
    });

    it('initializes and reports empty signature initially', () => {
      const mock = createMockCanvas();
      const pad = createSignaturePad(mock.canvas);
      expect(pad.isEmpty()).toBe(true);
      expect(pad.getSignatureData()).toEqual([]);
      pad.destroy();
      mock.restore();
    });

    it('collects strokes, handles undo and clear', () => {
      const mock = createMockCanvas();
      const pad = createSignaturePad(mock.canvas, { strokeColor: '#123456', strokeWidth: 3 });

      // Trigger pointerdown
      const downHandler = mock.listeners['pointerdown']?.[0];
      expect(downHandler).toBeDefined();
      downHandler!({ clientX: 10, clientY: 20, button: 0 });

      // Trigger pointermove
      const moveHandler = mock.windowListeners['pointermove']?.[0];
      expect(moveHandler).toBeDefined();
      moveHandler!({ clientX: 30, clientY: 40 });

      // Trigger pointerup
      const upHandler = mock.windowListeners['pointerup']?.[0];
      expect(upHandler).toBeDefined();
      upHandler!();

      expect(pad.isEmpty()).toBe(false);
      const data = pad.getSignatureData();
      expect(data.length).toBe(1);
      expect(data[0]!.points.length).toBe(2);
      expect(data[0]!.color).toBe('#123456');

      // Undo
      pad.undoSignature();
      expect(pad.isEmpty()).toBe(true);

      // Add another stroke and clear
      downHandler!({ clientX: 5, clientY: 5, button: 0 });
      upHandler!();
      expect(pad.isEmpty()).toBe(false);

      pad.clearSignature();
      expect(pad.isEmpty()).toBe(true);

      pad.destroy();
      mock.restore();
    });

    it('exports SVG with valid coordinates', () => {
      const mock = createMockCanvas();
      const pad = createSignaturePad(mock.canvas);

      mock.listeners['pointerdown']?.[0]!({ clientX: 15, clientY: 25, button: 0 });
      mock.windowListeners['pointerup']?.[0]!();

      const svg = pad.exportSignatureSvg();
      expect(svg).toContain('<svg');
      expect(svg).toContain('circle');
      pad.destroy();
      mock.restore();
    });

    it('throws error when exporting PNG on empty signature', () => {
      const mock = createMockCanvas();
      const pad = createSignaturePad(mock.canvas);
      expect(() => pad.exportSignaturePng()).toThrow(ValidationError);
      pad.destroy();
      mock.restore();
    });

    it('cleans up event listeners and handles repeated destroy calls gracefully', () => {
      const mock = createMockCanvas();
      const pad = createSignaturePad(mock.canvas);

      pad.destroy();
      expect(mock.canvas.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      // Second destroy call should be safe no-op
      expect(() => pad.destroy()).not.toThrow();
      mock.restore();
    });
  });
});
