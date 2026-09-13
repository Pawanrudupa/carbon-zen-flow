import { supabase } from "@/integrations/supabase/client";

export type QuickLogCategory = "food" | "transport" | "energy" | "shopping";
export type QuickLogConfidence = "high" | "medium" | "low";

export interface QuickLogResult {
  category: QuickLogCategory | null;
  subtype: string | null;
  quantity: number | null;
  unit: string | null;
  confidence: QuickLogConfidence;
  raw_input: string;
  description?: string;
  details?: {
    isOrganic?: boolean;
    isLocal?: boolean;
    isGreenTariff?: boolean;
    isSecondhand?: boolean;
    passengers?: number;
    from?: string;
    to?: string;
  };
  error?: string;
  errorDetails?: string;
}

export const ALLOWED_CATEGORIES: readonly QuickLogCategory[] = [
  "food",
  "transport",
  "energy",
  "shopping",
] as const;

export const ALLOWED_SUBTYPES = {
  food: [
    "vegetables",
    "chicken",
    "beef",
    "dairy",
    "grains",
    "pork",
    "fish",
    "eggs",
    "processed",
    "fastfood",
  ] as const,
  transport: [
    "car_petrol",
    "car_diesel",
    "car_electric",
    "motorcycle",
    "bus",
    "train",
    "metro",
    "cycle",
    "flight_domestic",
    "flight_international",
  ] as const,
  energy: ["electricity", "gas", "heating"] as const,
  shopping: [
    "clothing",
    "electronics",
    "furniture",
    "books",
    "appliances",
    "toys",
    "sports",
    "beauty",
    "jewelry",
  ] as const,
};

const SUBTYPE_ALIASES: Record<string, string> = {
  petrol_car: "car_petrol",
  car: "car_petrol",
  diesel_car: "car_diesel",
  electric_car: "car_electric",
  ev: "car_electric",
  bike: "cycle",
  bicycle: "cycle",
  flight: "flight_domestic",
  domestic_flight: "flight_domestic",
  international_flight: "flight_international",
  subway: "metro",
  natural_gas: "gas",
  electricity_coal: "electricity",
  clothes: "clothing",
  apparel: "clothing",
  gadget: "electronics",
  phone: "electronics",
  laptop: "electronics",
};

/**
 * Normalizes any subtype string to ensure it strictly matches
 * an allowed enum value recognized by the forms and ML inference.
 */
export function normalizeSubtype(
  category: QuickLogCategory,
  subtypeRaw: string | null | undefined
): string {
  if (!subtypeRaw) {
    if (category === "food") return "vegetables";
    if (category === "transport") return "car_petrol";
    if (category === "energy") return "electricity";
    return "clothing";
  }

  const cleaned = subtypeRaw.toLowerCase().trim();
  const aliased = SUBTYPE_ALIASES[cleaned] || cleaned;

  const allowed = ALLOWED_SUBTYPES[category] as readonly string[];
  if (allowed.includes(aliased)) {
    return aliased;
  }

  // Safe defaults if an unmapped subtype was returned
  switch (category) {
    case "food":
      return "vegetables";
    case "transport":
      return "car_petrol";
    case "energy":
      return "electricity";
    case "shopping":
      return "clothing";
  }
}

/**
 * Maps a successful QuickLogResult into the exact form state expected
 * by LogEntry.tsx and its subcomponents (FoodForm, TransportForm, etc.)
 */
export function mapQuickLogToForm(result: QuickLogResult): {
  activeTab: QuickLogCategory;
  formData: Record<string, string>;
} | null {
  if (!result.category || result.confidence === "low") {
    return null;
  }

  const category = result.category;
  const subtype = normalizeSubtype(category, result.subtype);
  const formData: Record<string, string> = {};

  if (category === "food") {
    formData.mealType = subtype;
    formData.portion = String(
      result.quantity && result.quantity > 0 ? result.quantity : 0.3
    );
    if (result.description || result.raw_input) {
      formData.desc = result.description || result.raw_input;
    }
    if (result.details?.isOrganic) formData.organic = "true";
    if (result.details?.isLocal) formData.local = "true";
    return { activeTab: "food", formData };
  }

  if (category === "transport") {
    formData.mode = subtype;
    formData.distance = String(
      result.quantity && result.quantity > 0 ? result.quantity : 0
    );
    formData.passengers = String(
      result.details?.passengers && result.details.passengers > 0
        ? result.details.passengers
        : 1
    );
    if (result.details?.from) formData.from = result.details.from;
    if (result.details?.to) formData.to = result.details.to;
    return { activeTab: "transport", formData };
  }

  if (category === "energy") {
    formData.energyType = subtype;
    formData.units = String(
      result.quantity && result.quantity > 0 ? result.quantity : 0
    );
    if (result.details?.isGreenTariff) formData.green = "true";
    return { activeTab: "energy", formData };
  }

  if (category === "shopping") {
    formData.shopCategory = subtype;
    formData.quantity = String(
      result.quantity && result.quantity > 0 ? result.quantity : 1
    );
    if (result.description || result.raw_input) {
      formData.itemDesc = result.description || result.raw_input;
    }
    if (result.details?.isSecondhand) formData.secondhand = "true";
    return { activeTab: "shopping", formData };
  }

  return null;
}

/**
 * Validates and sanitizes raw JSON/object received from edge function or mock
 */
export function sanitizeQuickLogResult(raw: any, rawInput: string): QuickLogResult {
  if (!raw || typeof raw !== "object") {
    return {
      category: null,
      subtype: null,
      quantity: 0,
      unit: "",
      confidence: "low",
      raw_input: rawInput,
      error: "Couldn't parse that — try the form below",
    };
  }

  const category = (
    ALLOWED_CATEGORIES.includes(raw.category) ? raw.category : null
  ) as QuickLogCategory | null;

  const confidence = (
    ["high", "medium", "low"].includes(raw.confidence)
      ? raw.confidence
      : category
      ? "medium"
      : "low"
  ) as QuickLogConfidence;

  const quantity = typeof raw.quantity === "number" && !isNaN(raw.quantity)
    ? raw.quantity
    : null;

  const subtype = category ? normalizeSubtype(category, raw.subtype) : null;

  return {
    category,
    subtype,
    quantity,
    unit: typeof raw.unit === "string" ? raw.unit : "",
    confidence,
    raw_input: rawInput,
    description: typeof raw.description === "string" ? raw.description : undefined,
    details: raw.details && typeof raw.details === "object" ? raw.details : undefined,
    error: raw.error || (confidence === "low" || !category ? "Couldn't parse that — try the form below" : undefined),
  };
}

/**
 * Sends a free-text input to the Gemini-backed ai-chat edge function in 'quick-log' mode.
 */
export async function parseQuickLogText(
  text: string,
  token?: string
): Promise<QuickLogResult> {
  const trimmed = text.trim().slice(0, 200);
  if (!trimmed) {
    return {
      category: null,
      subtype: null,
      quantity: 0,
      unit: "",
      confidence: "low",
      raw_input: "",
      error: "Couldn't parse that — try the form below",
    };
  }

  try {
    let authToken = token;
    if (!authToken) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      authToken = session?.access_token;
    }

    const headers: Record<string, string> = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const { data, error } = await supabase.functions.invoke<any>("ai-chat", {
      body: { query: trimmed, type: "quick-log" },
      headers,
    });

    if (error) {
      let detailedError = error.message;
      try {
        const ctx = (error as any).context;
        if (ctx) {
          const status = ctx.status;
          const bodyText = typeof ctx.text === "function" ? await ctx.text() : "";
          detailedError = `Edge function error${status ? ` (HTTP ${status})` : ""}: ${bodyText || error.message}`;
        }
      } catch {
        // ignore context body read error
      }
      console.error("Quick Log edge function call failed:", error, detailedError);
      return {
        category: null,
        subtype: null,
        quantity: 0,
        unit: "",
        confidence: "low",
        raw_input: trimmed,
        error: "Couldn't parse that — try the form below",
        errorDetails: detailedError,
      };
    }

    if (data?.error) {
      console.error("Quick Log backend returned error:", data.error);
      return {
        category: null,
        subtype: null,
        quantity: 0,
        unit: "",
        confidence: "low",
        raw_input: trimmed,
        error: "Couldn't parse that — try the form below",
        errorDetails: String(data.error),
      };
    }

    return sanitizeQuickLogResult(data?.parsed || data, trimmed);
  } catch (err) {
    console.error("Quick Log network error:", err);
    return {
      category: null,
      subtype: null,
      quantity: 0,
      unit: "",
      confidence: "low",
      raw_input: trimmed,
      error: "Couldn't parse that — try the form below",
      errorDetails: err instanceof Error ? err.message : String(err),
    };
  }
}
