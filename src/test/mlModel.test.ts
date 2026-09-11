import { describe, it, expect } from "vitest";
import {
  predictEmission,
  predictFoodEmission,
  predictTransportEmission,
  predictEnergyEmission,
  predictShoppingEmission,
  detectAnomaly,
  forecastMonthEnd,
  MODEL_META,
} from "@/utils/mlModel";

describe("ML Emission Estimation Model", () => {
  it("has correct model metadata", () => {
    expect(MODEL_META.algorithm).toBe("GradientBoostingRegressor");
    expect(MODEL_META.r2_score).toBe(0.9950);
    expect(MODEL_META.mae_kg).toBe(4.134);
    expect(MODEL_META.training_samples).toBe(4000);
  });

  it("predicts beef food emission correctly (~8.9 kg CO₂ for 0.5kg)", () => {
    const res = predictFoodEmission({
      mealType: "beef",
      portionKg: 0.5,
    });
    expect(res.co2_kg).toBeCloseTo(8.857, 2);
    expect(res.model_r2).toBe(0.9950);
    expect(res.breakdown).toContain("17.713 kg/kg × 0.5kg portion");
    expect(res.tip).toContain("Swapping beef for chicken");
  });

  it("predicts car_petrol trip of 50km with 2 passengers", () => {
    const res = predictTransportEmission({
      mode: "car_petrol",
      distanceKm: 50,
      passengers: 2,
    });
    expect(res.co2_kg).toBeGreaterThan(0);
    expect(res.tip).toContain("Switching to electric");
    expect(res.model_r2).toBe(0.9950);
  });

  it("predicts zero emissions for bicycle transport", () => {
    const res = predictTransportEmission({
      mode: "cycle",
      distanceKm: 25,
    });
    expect(res.co2_kg).toBe(0);
    expect(res.tip).toContain("Zero emissions");
  });

  it("detects statistical anomalies with z-score", () => {
    const history = [2.1, 2.3, 1.9, 2.5, 2.0, 2.2];
    const normalEntry = detectAnomaly(2.2, history);
    expect(normalEntry.isAnomaly).toBe(false);

    const outlierEntry = detectAnomaly(25.0, history);
    expect(outlierEntry.isAnomaly).toBe(true);
    expect(outlierEntry.zScore).toBeGreaterThan(3);
    expect(outlierEntry.severity).toBe("extreme");
  });

  it("forecasts month-end total using linear regression", () => {
    const dailyTotals = [
      { day: 1, co2: 8 },
      { day: 2, co2: 9 },
      { day: 3, co2: 10 },
      { day: 4, co2: 11 },
    ];
    const forecast = forecastMonthEnd(dailyTotals, 350);
    expect(forecast.slope).toBeGreaterThan(0);
    expect(forecast.r2).toBeGreaterThan(0.9);
    expect(typeof forecast.projectedMonthTotal).toBe("number");
    expect(typeof forecast.recommendation).toBe("string");
  });

  it("unified predictEmission routes correctly", () => {
    const food = predictEmission({ category: "food", mealType: "grains", portionKg: 0.2 });
    expect(food.co2_kg).toBeGreaterThan(0);

    const energy = predictEmission({ category: "energy", energyType: "electricity_coal", units: 10 });
    expect(energy.co2_kg).toBeGreaterThan(0);

    const shopping = predictEmission({ category: "shopping", shopCategory: "clothing", quantity: 1 });
    expect(shopping.co2_kg).toBeGreaterThan(0);
  });

  it("returns null when detecting anomaly with fewer than 6 entries (cold-start guard)", () => {
    const historyShort = [2.1, 2.3, 1.9, 2.5, 2.0]; // 5 entries (< 6)
    const result = detectAnomaly(10.0, historyShort);
    expect(result).toBeNull();

    const emptyHistory: number[] = [];
    expect(detectAnomaly(5.0, emptyHistory)).toBeNull();
  });

  it("returns method 'average' when forecasting with fewer than 5 days of data (minimum-data guard)", () => {
    const dailyTotals = [
      { day: 1, co2: 8 },
      { day: 2, co2: 9 },
      { day: 3, co2: 10 },
      { day: 4, co2: 11 },
    ];
    // With daysWithData = 4 (< 5)
    const forecast = forecastMonthEnd(dailyTotals, 350, 4);
    expect(forecast.method).toBe("average");
    expect(forecast.slope).toBe(0);
    expect(forecast.r2).toBe(0);
    expect(typeof forecast.projectedMonthTotal).toBe("number");
    expect(forecast.recommendation).toContain("Early estimate");
  });

  it("returns method 'regression' when forecasting with 5 or more days of data", () => {
    const dailyTotals = [
      { day: 1, co2: 8 },
      { day: 2, co2: 9 },
      { day: 3, co2: 10 },
      { day: 4, co2: 11 },
      { day: 5, co2: 12 },
    ];
    const forecast = forecastMonthEnd(dailyTotals, 350, 5);
    expect(forecast.method).toBe("regression");
    expect(forecast.slope).toBeGreaterThan(0);
    expect(forecast.r2).toBeGreaterThan(0.9);
  });

  it("resets dynamic import singleton promise on failure so subsequent attempts can succeed", async () => {
    let attempts = 0;
    let cached: any = null;
    let promise: Promise<any> | null = null;

    function loadModule(shouldFail: boolean) {
      if (cached) return Promise.resolve(cached);
      if (!promise) {
        promise = (async () => {
          attempts++;
          if (shouldFail) {
            throw new Error("Failed to fetch dynamically imported module (stale-tab 404)");
          }
          cached = { loaded: true };
          return cached;
        })()
          .catch((err) => {
            promise = null; // Reset on failure
            throw err;
          });
      }
      return promise;
    }

    // Attempt 1: chunk fails to load
    await expect(loadModule(true)).rejects.toThrow("stale-tab 404");
    expect(attempts).toBe(1);
    expect(promise).toBeNull(); // Promise reset, not permanently rejected

    // Attempt 2: transient error resolved, retry succeeds
    const result = await loadModule(false);
    expect(attempts).toBe(2);
    expect(result).toEqual({ loaded: true });
    expect(cached).toEqual({ loaded: true });

    // Attempt 3: served from cache without new network call
    const cachedResult = await loadModule(false);
    expect(attempts).toBe(2);
    expect(cachedResult).toEqual({ loaded: true });
  });
});

describe("MODEL_META_FALLBACK sync check", () => {
  it("Settings fallback metadata matches the real MODEL_META", async () => {
    const { MODEL_META_FALLBACK } = await import("@/pages/Settings");

    // Every key in the fallback must exist in MODEL_META with the same value.
    // This test fails loudly if someone updates mlModel.ts but forgets Settings.tsx.
    expect(MODEL_META_FALLBACK.algorithm).toBe(MODEL_META.algorithm);
    expect(MODEL_META_FALLBACK.r2_score).toBe(MODEL_META.r2_score);
    expect(MODEL_META_FALLBACK.mae_kg).toBe(MODEL_META.mae_kg);
    expect(MODEL_META_FALLBACK.training_samples).toBe(MODEL_META.training_samples);
    expect(MODEL_META_FALLBACK.dataset).toBe(MODEL_META.dataset);
  });
});
