const FileViewerTurbo = require('./NativeFileViewerTurbo').default;

export function multiply(a: number, b: number): number {
  return FileViewerTurbo.multiply(a, b);
}
