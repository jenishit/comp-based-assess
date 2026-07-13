export const EQ = {
  forest:      '#4A7C59',
  sage:        '#7FB069',
  darkForest:  '#2E5C3A',
  dark:        '#1E1208',
  cream:       '#FAF6EF',
  tanAlt:      '#F0E8D6',
  tan:         '#C4A882',
  brown:       '#8B6347',
  borderLight: '#E0D0B8',
  olive:       '#6B7C3F',
} as const;

export type EQKey = keyof typeof EQ;