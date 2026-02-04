export const brandsList = [
  "OPPO",
  "VIVO",
  "XIAOMI",
  "SAMSUNG",
  "APPLE",
  "REALME",
  "INFINIX",
  "ITEL",
  "NOKIA",
  "ADVAN",
  "TECNO",
  "OTHERS",
] as const;

export type Brand = (typeof brandsList)[number];
