// utils/themeUtils.ts
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Helper to get dark mode classes
export const getThemeClasses = (lightClass: string, darkClass: string) => {
  return `${lightClass} dark:${darkClass}`;
};

// Common theme combinations
export const Theme = {
  background: getThemeClasses('bg-background-light', 'bg-background-dark'),
  card: getThemeClasses('bg-card-light', 'bg-card-dark'),
  elevated: getThemeClasses('bg-elevated-light', 'bg-elevated-dark'),
  text: {
    primary: getThemeClasses('text-text-primary-light', 'text-text-primary-dark'),
    secondary: getThemeClasses('text-text-secondary-light', 'text-text-secondary-dark'),
    tertiary: getThemeClasses('text-text-tertiary-light', 'text-text-tertiary-dark'),
  },
  border: getThemeClasses('border-border-light', 'border-border-dark'),
};