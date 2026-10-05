/**
 * Print sizing. A phone camera needs each module to cover enough pixels; a
 * widely used rule of thumb is that a ~33-module code (version 2 plus quiet
 * zone) needs to be about 1/10 of the scanning distance. We scale that by
 * the module count so denser codes get proportionally larger.
 */
const DISTANCE_PER_MODULE = 330;
export const MIN_PRINT_MM = 20;

/** Minimum width (mm) of the code incl. quiet zone for a scan distance. */
export function minWidthForDistance(distanceMm: number, totalModules: number) {
  return Math.max(MIN_PRINT_MM, (totalModules * distanceMm) / DISTANCE_PER_MODULE);
}

/** Furthest reliable scan distance (mm) for a printed width. */
export function maxDistanceForWidth(widthMm: number, totalModules: number) {
  return (widthMm * DISTANCE_PER_MODULE) / totalModules;
}

export function moduleSizeMm(widthMm: number, totalModules: number) {
  return widthMm / totalModules;
}

export function formatDistance(mm: number) {
  return mm >= 1000 ? `${(mm / 1000).toFixed(1)} m` : `${Math.round(mm / 10)} cm`;
}
