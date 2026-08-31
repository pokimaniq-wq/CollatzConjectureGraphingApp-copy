export interface CollatzSequence {
  id: number;
  startingNumber: number;
  name: string;
  color: string;
  values: number[];
}

export const LINE_COLORS = [
  "#00d2ff",
  "#ff6b6b",
  "#96e6a1",
  "#ffd93d",
  "#a29bfe",
  "#fd79a8",
  "#4ecdc4",
  "#e17055",
  "#74b9ff",
  "#55efc4",
  "#f9ca24",
  "#ff9ff3",
];

export function collatzSequence(n: number): number[] {
  if (n <= 0 || !Number.isInteger(n)) return [];
  const seq = [n];
  let current = n;
  while (current !== 1 && seq.length < 200000) {
    current = current % 2 === 0 ? current / 2 : 3 * current + 1;
    seq.push(current);
  }
  return seq;
}

export function getGridInterval(termCount: number): number {
  if (termCount < 100) return 1;
  if (termCount < 1000) return 10;
  if (termCount < 10000) return 100;
  if (termCount < 100000) return 1000;
  return 10000;
}

export function getSecondsPerTerm(termCount: number): number {
  if (termCount < 100) return 0.5;
  if (termCount < 1000) return 0.05;
  if (termCount < 10000) return 0.005;
  return 0.0005;
}

export interface JSONExport {
  version: number;
  sequences: Array<{
    startingNumber: number;
    color: string;
    name: string;
    values: number[];
  }>;
}
