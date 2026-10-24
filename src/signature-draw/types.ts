export interface SignaturePoint {
  x: number;
  y: number;
  time?: number;
}

export interface SignatureStroke {
  points: SignaturePoint[];
  color: string;
  width: number;
}

export interface SignaturePadOptions {
  strokeColor?: string; // Default #000000
  strokeWidth?: number; // Default 2.5
  backgroundColor?: string; // Default transparent (undefined or 'transparent')
  minWidth?: number;
  maxWidth?: number;
}

export interface SignatureSvgOptions {
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

export interface SignaturePadInstance {
  getSignatureData(): SignatureStroke[];
  clearSignature(): void;
  undoSignature(): void;
  isEmpty(): boolean;
  exportSignaturePng(options?: { backgroundColor?: string }): string;
  exportSignatureSvg(options?: SignatureSvgOptions): string;
  setStrokeColor(color: string): void;
  setStrokeWidth(width: number): void;
  destroy(): void;
}
