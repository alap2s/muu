// For reference only. All runtime accent color comes from CSS variable --accent.
// Do not use brand, brandLight, or brandDark directly in components.
// Use CSS var(--accent) for all accent/brand color at runtime.

export const colors = {
  // Brand colors
  brand: '#6237FF',
  brandLight: '#7B5AFF',
  brandDark: '#4A1FFF',
  
  // Light mode colors
  light: {
    background: {
      main: '#F8F6F4',
      secondary: '#F8F6F4',
      tertiary: '#F0EDEA'
    },
    text: {
      primary: '#1e1e1e',      // Dark gray for primary text
      secondary: 'rgba(30, 30, 30, 0.5)',  // 50% opacity dark gray for secondary text
      brand: '#6237FF'         // Brand purple for emphasis
    },
    border: {
      main: '#EEEAFF',
      secondary: '#EEEAFF'
    }
  },
  
  // Dark mode colors
  dark: {
    background: {
      main: '#1A1A1A',
      secondary: '#242424',
      tertiary: '#2D2D2D'
    },
    text: {
      primary: '#F8F6F4',      // Off-white for primary text
      secondary: 'rgba(248, 246, 244, 0.7)',  // 70% opacity off-white for secondary text
      brand: '#6237FF'         // Brand purple for emphasis
    },
    border: {
      main: 'rgba(248, 246, 244, 0.12)',
      secondary: 'rgba(248, 246, 244, 0.08)'
    }
  },
  // Gray mode colors (black & grays only)
  gray: {
    background: {
      main: '#181818',
      secondary: '#232323',
      tertiary: '#2C2C2C'
    },
    text: {
      primary: '#F5F5F5',
      secondary: 'rgba(245, 245, 245, 0.6)',
      brand: '#F5F5F5' // No purple, just gray/white
    },
    border: {
      main: '#232323',
      secondary: '#2C2C2C'
    }
  }
} 
