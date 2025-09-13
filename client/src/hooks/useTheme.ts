import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
}

export function useTheme() {
  const { data: theme, isLoading, error } = useQuery<Theme>({
    queryKey: ["/api/theme"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (theme) {
      applyTheme(theme);
    }
  }, [theme]);

  return { theme, isLoading, error };
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Apply colors
  root.style.setProperty('--primary', theme.primaryColor);
  root.style.setProperty('--secondary', theme.secondaryColor);
  root.style.setProperty('--accent', theme.accentColor);
  root.style.setProperty('--background', theme.backgroundColor);
  root.style.setProperty('--foreground', theme.textColor);
  
  // Apply related color variants
  // For primary variants
  root.style.setProperty('--primary-foreground', calculateContrastColor(theme.primaryColor));
  root.style.setProperty('--ring', theme.primaryColor);
  
  // For secondary variants
  root.style.setProperty('--secondary-foreground', theme.textColor);
  root.style.setProperty('--muted', theme.secondaryColor);
  root.style.setProperty('--muted-foreground', adjustLightness(theme.textColor, 30));
  
  // For accent variants
  root.style.setProperty('--accent-foreground', calculateContrastColor(theme.accentColor));
  
  // For card and popover colors
  root.style.setProperty('--card', theme.backgroundColor);
  root.style.setProperty('--card-foreground', theme.textColor);
  root.style.setProperty('--popover', theme.backgroundColor);
  root.style.setProperty('--popover-foreground', theme.textColor);
  
  // For border and input colors
  root.style.setProperty('--border', adjustLightness(theme.textColor, 85));
  root.style.setProperty('--input', adjustLightness(theme.textColor, 85));
  
  // Apply font family
  root.style.setProperty('--font-sans', theme.fontFamily);
  
  // Apply border radius
  root.style.setProperty('--radius', theme.borderRadius);
  
  // Update sidebar colors to match theme
  root.style.setProperty('--sidebar-background', adjustLightness(theme.backgroundColor, -5));
  root.style.setProperty('--sidebar-foreground', theme.textColor);
  root.style.setProperty('--sidebar-primary', theme.primaryColor);
  root.style.setProperty('--sidebar-primary-foreground', calculateContrastColor(theme.primaryColor));
  root.style.setProperty('--sidebar-accent', theme.secondaryColor);
  root.style.setProperty('--sidebar-accent-foreground', calculateContrastColor(theme.secondaryColor));
  root.style.setProperty('--sidebar-border', adjustLightness(theme.textColor, 85));
  root.style.setProperty('--sidebar-ring', theme.primaryColor);
  
  // Update chart colors
  root.style.setProperty('--chart-1', theme.primaryColor);
  root.style.setProperty('--chart-2', theme.accentColor);
  root.style.setProperty('--chart-3', adjustLightness(theme.primaryColor, 10));
  root.style.setProperty('--chart-4', adjustLightness(theme.accentColor, -10));
  root.style.setProperty('--chart-5', adjustLightness(theme.primaryColor, -10));
}

// Helper function to calculate contrast color (supports decimal HSL values)
function calculateContrastColor(hslColor: string): string {
  // Extract lightness from HSL string - supports decimals and both comma/space separators
  const match = hslColor.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?\s*\)/);
  if (match) {
    const lightness = parseFloat(match[3]);
    // If dark color, return light foreground, if light color, return dark foreground
    return lightness < 50 ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)';
  }
  // Fallback
  return 'hsl(222.2 84% 4.9%)';
}

// Helper function to adjust lightness of HSL color (supports decimal HSL values)
function adjustLightness(hslColor: string, adjustment: number): string {
  const match = hslColor.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?\s*\)/);
  if (match) {
    const hue = parseFloat(match[1]);
    const saturation = parseFloat(match[2]);
    const lightness = Math.max(0, Math.min(100, parseFloat(match[3]) + adjustment));
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  }
  // Return original color if parsing fails
  return hslColor;
}