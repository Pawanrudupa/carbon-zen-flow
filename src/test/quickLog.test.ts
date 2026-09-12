import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseQuickLogText,
  mapQuickLogToForm,
  normalizeSubtype,
  sanitizeQuickLogResult,
  ALLOWED_SUBTYPES,
  QuickLogResult,
} from "@/services/quickLogService";
import { predictEmission } from "@/utils/mlModel";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase functions invoke
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
      }),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("Quick Log NLP Entry Parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Subtype Normalization & Enum Safety", () => {
    it("normalizes common transport aliases to exact enum values", () => {
      expect(normalizeSubtype("transport", "petrol_car")).toBe("car_petrol");
      expect(normalizeSubtype("transport", "car")).toBe("car_petrol");
      expect(normalizeSubtype("transport", "electric_car")).toBe("car_electric");
      expect(normalizeSubtype("transport", "ev")).toBe("car_electric");
      expect(normalizeSubtype("transport", "bike")).toBe("cycle");
      expect(normalizeSubtype("transport", "subway")).toBe("metro");
      expect(normalizeSubtype("transport", "flight")).toBe("flight_domestic");
    });

    it("normalizes shopping and food aliases to exact enum values", () => {
      expect(normalizeSubtype("food", "chicken")).toBe("chicken");
      expect(normalizeSubtype("food", "beef")).toBe("beef");
      expect(normalizeSubtype("food", "unknown_alien_food")).toBe("vegetables");

      expect(normalizeSubtype("shopping", "clothes")).toBe("clothing");
      expect(normalizeSubtype("shopping", "laptop")).toBe("electronics");
      expect(normalizeSubtype("shopping", "phone")).toBe("electronics");
      expect(normalizeSubtype("shopping", "unknown_item")).toBe("clothing");
    });

    it("ensures all allowed subtypes match keys accepted by predictEmission / mlModel", () => {
      // Test each food subtype
      ALLOWED_SUBTYPES.food.forEach((sub) => {
        expect(() =>
          predictEmission({
            category: "food",
            mealType: sub as any,
            portionKg: 0.3,
          })
        ).not.toThrow();
      });

      // Test each transport mode
      ALLOWED_SUBTYPES.transport.forEach((sub) => {
        const pred = predictEmission({
          category: "transport",
          mode: sub as any,
          distanceKm: 25,
        });
        expect(typeof pred.co2_kg).toBe("number");
        expect(pred.co2_kg).toBeGreaterThanOrEqual(0);
      });

      // Test each energy type
      ALLOWED_SUBTYPES.energy.forEach((sub) => {
        const energyTypeMap: Record<string, string> = {
          electricity: "electricity_coal",
          gas: "natural_gas",
          heating: "heating_oil",
        };
        const mappedType = energyTypeMap[sub] || sub;
        const pred = predictEmission({
          category: "energy",
          energyType: mappedType as any,
          units: 10,
        });
        expect(typeof pred.co2_kg).toBe("number");
        expect(pred.co2_kg).toBeGreaterThan(0);
      });

      // Test each shopping category
      ALLOWED_SUBTYPES.shopping.forEach((sub) => {
        const pred = predictEmission({
          category: "shopping",
          shopCategory: sub as any,
          quantity: 1,
        });
        expect(typeof pred.co2_kg).toBe("number");
        expect(pred.co2_kg).toBeGreaterThan(0);
      });
    });
  });

  describe("Structured Field Extraction via parseQuickLogText", () => {
    it("parses a well-formed food input: 'had a chicken burger for lunch'", async () => {
      const mockResult: QuickLogResult = {
        category: "food",
        subtype: "chicken",
        quantity: 0.3,
        unit: "kg",
        confidence: "high",
        raw_input: "had a chicken burger for lunch",
        description: "Chicken burger",
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { parsed: mockResult },
        error: null,
      });

      const parsed = await parseQuickLogText("had a chicken burger for lunch");

      expect(parsed.category).toBe("food");
      expect(parsed.subtype).toBe("chicken");
      expect(parsed.quantity).toBe(0.3);
      expect(parsed.unit).toBe("kg");
      expect(parsed.confidence).toBe("high");

      const formState = mapQuickLogToForm(parsed);
      expect(formState).not.toBeNull();
      expect(formState?.activeTab).toBe("food");
      expect(formState?.formData.mealType).toBe("chicken");
      expect(formState?.formData.portion).toBe("0.3");
    });

    it("parses a round-trip transport input: 'drove 40km to office and back' as total distance 80km", async () => {
      const mockResult: QuickLogResult = {
        category: "transport",
        subtype: "car_petrol",
        quantity: 80,
        unit: "km",
        confidence: "high",
        raw_input: "drove 40km to office and back",
        details: { passengers: 1 },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { parsed: mockResult },
        error: null,
      });

      const parsed = await parseQuickLogText("drove 40km to office and back");

      expect(parsed.category).toBe("transport");
      expect(parsed.subtype).toBe("car_petrol");
      expect(parsed.quantity).toBe(80);
      expect(parsed.unit).toBe("km");
      expect(parsed.confidence).toBe("high");

      const formState = mapQuickLogToForm(parsed);
      expect(formState?.activeTab).toBe("transport");
      expect(formState?.formData.mode).toBe("car_petrol");
      expect(formState?.formData.distance).toBe("80");
      expect(formState?.formData.passengers).toBe("1");
    });

    it("parses a one-way transport input: 'drove 40km to the office' as stated distance 40km", async () => {
      const mockResult: QuickLogResult = {
        category: "transport",
        subtype: "car_petrol",
        quantity: 40,
        unit: "km",
        confidence: "high",
        raw_input: "drove 40km to the office",
        details: { passengers: 1 },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { parsed: mockResult },
        error: null,
      });

      const parsed = await parseQuickLogText("drove 40km to the office");

      expect(parsed.category).toBe("transport");
      expect(parsed.subtype).toBe("car_petrol");
      expect(parsed.quantity).toBe(40);
      expect(parsed.unit).toBe("km");
      expect(parsed.confidence).toBe("high");

      const formState = mapQuickLogToForm(parsed);
      expect(formState?.activeTab).toBe("transport");
      expect(formState?.formData.mode).toBe("car_petrol");
      expect(formState?.formData.distance).toBe("40");
      expect(formState?.formData.passengers).toBe("1");
    });

    it("parses a well-formed energy input: 'ran the AC for 3 hours'", async () => {
      const mockResult: QuickLogResult = {
        category: "energy",
        subtype: "electricity",
        quantity: 3,
        unit: "units",
        confidence: "high",
        raw_input: "ran the AC for 3 hours",
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { parsed: mockResult },
        error: null,
      });

      const parsed = await parseQuickLogText("ran the AC for 3 hours");

      expect(parsed.category).toBe("energy");
      expect(parsed.subtype).toBe("electricity");
      expect(parsed.quantity).toBe(3);

      const formState = mapQuickLogToForm(parsed);
      expect(formState?.activeTab).toBe("energy");
      expect(formState?.formData.energyType).toBe("electricity");
      expect(formState?.formData.units).toBe("3");
    });

    it("parses a well-formed shopping input: 'bought a secondhand jacket'", async () => {
      const mockResult: QuickLogResult = {
        category: "shopping",
        subtype: "clothing",
        quantity: 1,
        unit: "units",
        confidence: "high",
        raw_input: "bought a secondhand jacket",
        description: "Secondhand jacket",
        details: { isSecondhand: true },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { parsed: mockResult },
        error: null,
      });

      const parsed = await parseQuickLogText("bought a secondhand jacket");

      expect(parsed.category).toBe("shopping");
      expect(parsed.subtype).toBe("clothing");

      const formState = mapQuickLogToForm(parsed);
      expect(formState?.activeTab).toBe("shopping");
      expect(formState?.formData.shopCategory).toBe("clothing");
      expect(formState?.formData.secondhand).toBe("true");
    });
  });

  describe("Ambiguous Inputs & Failure Handling", () => {
    it("returns low confidence and null form state for ambiguous input: 'had some food'", async () => {
      const mockAmbiguousResult: QuickLogResult = {
        category: null,
        subtype: null,
        quantity: null,
        unit: null,
        confidence: "low",
        raw_input: "had some food",
        error: "Couldn't parse that — try the form below",
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { parsed: mockAmbiguousResult },
        error: null,
      });

      const parsed = await parseQuickLogText("had some food");

      expect(parsed.confidence).toBe("low");
      expect(parsed.category).toBeNull();

      // mapQuickLogToForm must return null so that manual form is left untouched/empty
      const formState = mapQuickLogToForm(parsed);
      expect(formState).toBeNull();
    });

    it("handles edge function network error gracefully without crashing", async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(
        new Error("Network disconnect")
      );

      const parsed = await parseQuickLogText("drove 10km");

      expect(parsed.confidence).toBe("low");
      expect(parsed.category).toBeNull();
      expect(parsed.error).toBe("Couldn't parse that — try the form below");

      const formState = mapQuickLogToForm(parsed);
      expect(formState).toBeNull();
    });

    it("handles empty or pure whitespace input without firing network request", async () => {
      const parsed = await parseQuickLogText("   ");

      expect(supabase.functions.invoke).not.toHaveBeenCalled();
      expect(parsed.confidence).toBe("low");
      expect(parsed.category).toBeNull();
      expect(mapQuickLogToForm(parsed)).toBeNull();
    });
  });

  describe("ML Emission Calculation Parity", () => {
    it("produces identical CO2 prediction for Quick Log prefilled transport form vs manual selection", () => {
      const quickLogParsed: QuickLogResult = {
        category: "transport",
        subtype: "car_petrol",
        quantity: 40,
        unit: "km",
        confidence: "high",
        raw_input: "drove 40km",
      };

      const formState = mapQuickLogToForm(quickLogParsed)!;

      // Pipeline calculation using form values (same as LogEntry.tsx)
      const quickLogEmission = predictEmission({
        category: "transport",
        mode: formState.formData.mode as any,
        distanceKm: parseFloat(formState.formData.distance),
        passengers: parseInt(formState.formData.passengers || "1"),
      });

      // Pipeline calculation for direct manual selection
      const manualEmission = predictEmission({
        category: "transport",
        mode: "car_petrol",
        distanceKm: 40,
        passengers: 1,
      });

      expect(quickLogEmission.co2_kg).toBe(manualEmission.co2_kg);
      expect(quickLogEmission.co2_kg).toBeGreaterThan(0);
    });

    it("produces identical CO2 prediction for round-trip prefill (80km) vs manual 80km entry", () => {
      const quickLogParsed: QuickLogResult = {
        category: "transport",
        subtype: "car_petrol",
        quantity: 80,
        unit: "km",
        confidence: "high",
        raw_input: "drove 40km to office and back",
      };

      const formState = mapQuickLogToForm(quickLogParsed)!;

      const quickLogEmission = predictEmission({
        category: "transport",
        mode: formState.formData.mode as any,
        distanceKm: parseFloat(formState.formData.distance),
        passengers: parseInt(formState.formData.passengers || "1"),
      });

      const manualEmission = predictEmission({
        category: "transport",
        mode: "car_petrol",
        distanceKm: 80,
        passengers: 1,
      });

      expect(quickLogEmission.co2_kg).toBe(manualEmission.co2_kg);
      expect(quickLogEmission.co2_kg).toBeGreaterThan(0);
    });

    it("produces identical CO2 prediction for Quick Log prefilled food form vs manual selection", () => {
      const quickLogParsed: QuickLogResult = {
        category: "food",
        subtype: "chicken",
        quantity: 0.3,
        unit: "kg",
        confidence: "high",
        raw_input: "had chicken for lunch",
      };

      const formState = mapQuickLogToForm(quickLogParsed)!;

      const quickLogEmission = predictEmission({
        category: "food",
        mealType: formState.formData.mealType as any,
        portionKg: parseFloat(formState.formData.portion),
        isOrganic: formState.formData.organic === "true",
        isLocal: formState.formData.local === "true",
      });

      const manualEmission = predictEmission({
        category: "food",
        mealType: "chicken",
        portionKg: 0.3,
        isOrganic: false,
        isLocal: false,
      });

      expect(quickLogEmission.co2_kg).toBe(manualEmission.co2_kg);
    });
  });
});
