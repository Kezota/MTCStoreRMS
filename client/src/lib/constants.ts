export const brandsList = [
  "OPPO",
  "VIVO",
  "XIAOMI",
  "SAMSUNG",
  "APPLE",
  "REALME",
  "ITEL",
  "NOKIA",
  "ADVAN",
  "INFINIX",
  "TECNO",
  "OTHERS",
] as const;

export type Brand = (typeof brandsList)[number];
