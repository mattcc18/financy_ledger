/**
 * Utility functions for dashboard components
 */

/**
 * Convert hex color to rgba string
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return `rgba(128, 128, 128, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Get opacity value as hex string for Material-UI
 */
export const getOpacity = (base: number): string => {
  return Math.round(base * 255).toString(16).padStart(2, '0');
};

/**
 * Get border opacity value as hex string for Material-UI
 */
export const getBorderOpacity = (base: number): string => {
  return Math.round(base * 255).toString(16).padStart(2, '0');
};



