export const EQ = {
  forest: '#4B7B6E',
  sage: '#4B7B6E',
  darkForest: '#3C6459',
  dark: '#211E2B',
  cream: '#F2EFE6',
  tanAlt: '#F6EBD3',
  tan: '#D9A441',
  brown: '#726C7E',
  borderLight: '#E4DFD1',
  olive: '#3C6459',
} as const;

export type EQKey = keyof typeof EQ;
