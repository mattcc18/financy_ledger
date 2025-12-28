/**
 * Color palette definitions for the dashboard.
 */

export interface DashboardPalette {
  card_bg: string;
  card_text: string;
  card_subtext: string;
  card_accent: string;
  net_worth: string;
  cash: string;
  investment: string;
  donut_colors: string[];
  checkbox_color?: string;
}

export interface NavPalette {
  bg: string;
  bg_solid: string;
  title_color: string;
  button_color: string;
  button_hover: string;
  border: string;
  checkbox_color: string;
}

export const DASHBOARD_PALETTES: Record<string, DashboardPalette> = {
  "Dark Mode": {
    card_bg: "#1E1E1E",
    card_text: "#FFFFFF",
    card_subtext: "#B0B0B0",
    card_accent: "#808080",
    net_worth: "#808080", // Keep original gray
    cash: "#10B981", // Green
    investment: "#F59E0B", // Yellow/Amber
    donut_colors: [
      '#3B82F6', // Bright blue
      '#10B981', // Emerald green
      '#F59E0B', // Amber/Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#84CC16', // Lime green (distinct from yellow)
      '#6366F1'  // Indigo
    ]
  },
  "Light Mode": {
    card_bg: "#F5F5F5",
    card_text: "#212121",
    card_subtext: "#757575",
    card_accent: "#9E9E9E",
    net_worth: "#1976D2",
    cash: "#42A5F5",
    investment: "#64B5F6",
    donut_colors: ['#1976D2', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB', '#9E9E9E', '#757575']
  },
  "Mint Fresh": {
    card_bg: "#0F3D3E",
    card_text: "#E8F5E5",
    card_subtext: "#9EC5AB",
    card_accent: "#6A9C89",
    net_worth: "#4A9E8F",
    cash: "#5EFC8D",
    investment: "#00E5FF",
    donut_colors: ['#0A2E2F', '#0F3D3E', '#14524F', '#2A6A64', '#4A9E8F', '#6FCFB4', '#9EF5DC']
  },
  "Ocean Blue": {
    card_bg: "#1A2332",
    card_text: "#E8F0F7",
    card_subtext: "#8BA8C7",
    card_accent: "#5F7A9D",
    net_worth: "#5F7A9D",
    cash: "#FFA726",
    investment: "#29B6F6",
    donut_colors: ['#151B28', '#1A2332', '#273548', '#3D5A80', '#5F7A9D', '#8BA8C7', '#B8D4E8']
  }
};

export const NAV_PALETTES: Record<string, NavPalette> = {
  "Dark Mode": {
    bg: "linear-gradient(to right, #1A1A1A, #2A2A2A)",
    bg_solid: "#1A1A1A",
    title_color: "#FFFFFF",
    button_color: "#B0B0B0",
    button_hover: "rgba(255, 255, 255, 0.1)",
    border: "rgba(255, 255, 255, 0.1)",
    checkbox_color: "#42A5F5"
  },
  "Light Mode": {
    bg: "linear-gradient(to right, #FFFFFF, #F8F9FA)",
    bg_solid: "#FFFFFF",
    title_color: "#1A1A1A",
    button_color: "#4A4A4A",
    button_hover: "rgba(0, 0, 0, 0.04)",
    border: "rgba(0, 0, 0, 0.05)",
    checkbox_color: "#1976D2"
  },
  "Mint Fresh": {
    bg: "linear-gradient(to right, #0A1F1F, #0F3D3E)",
    bg_solid: "#0F3D3E",
    title_color: "#E8F5E5",
    button_color: "#9EF5DC",
    button_hover: "rgba(158, 245, 220, 0.15)",
    border: "rgba(111, 207, 180, 0.25)",
    checkbox_color: "#5EFC8D"
  },
  "Ocean Blue": {
    bg: "linear-gradient(to right, #0D1520, #1A2332)",
    bg_solid: "#1A2332",
    title_color: "#E8F0F7",
    button_color: "#B8D4E8",
    button_hover: "rgba(184, 212, 232, 0.15)",
    border: "rgba(95, 122, 157, 0.25)",
    checkbox_color: "#5F7A9D"
  }
};

export const PALETTE_BACKGROUNDS: Record<string, string> = {
  "Dark Mode": "#0E0E0E",
  "Light Mode": "#F8F9FA",
  "Mint Fresh": "#0A1F1F",
  "Ocean Blue": "#0D1520"
};

export const PALETTE_TEXT_COLORS: Record<string, string> = {
  "Dark Mode": "#FFFFFF",
  "Light Mode": "#1A1A1A",
  "Mint Fresh": "#E8F5E5",
  "Ocean Blue": "#E8F0F7"
};

export const PALETTE_SUBTEXT_COLORS: Record<string, string> = {
  "Dark Mode": "#B0B0B0",
  "Light Mode": "#757575",
  "Mint Fresh": "#9EC5AB",
  "Ocean Blue": "#8BA8C7"
};

export function getDashboardPalette(paletteName: string = "Light Mode"): DashboardPalette {
  return DASHBOARD_PALETTES[paletteName] || DASHBOARD_PALETTES["Light Mode"];
}

export function getNavPalette(paletteName: string = "Light Mode"): NavPalette {
  return NAV_PALETTES[paletteName] || NAV_PALETTES["Light Mode"];
}



