/**
 * Fallback ML model metadata used when the dynamic ML chunk has not yet loaded
 * or failed to load. Must stay in sync with mlModel.ts MODEL_META.
 */
export const MODEL_META_FALLBACK = {
  algorithm: "GradientBoostingRegressor",
  r2_score: 0.9950,
  mae_kg: 4.134,
  training_samples: 4000,
  dataset:
    "Synthetic dataset based on IPCC AR6 emission factors, EPA guidelines, and IEA energy data",
} as const;
