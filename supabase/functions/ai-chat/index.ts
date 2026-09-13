import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query = '', type = 'chat' } = await req.json()
    
    // 1. Authenticate Request
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    if (!authHeader) throw new Error('Frontend failed to send Authorization header')
    const token = authHeader.replace('Bearer ', '').trim()

    // 2. Initialize Database Client with RLS Enabled
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error('Supabase rejected the token')

    // ── QUICK LOG NLP EXTRACTION MODE ──────────────────────────────────────
    if (type === 'quick-log') {
      const rawText = String(query || '').trim()
      if (!rawText) {
        return new Response(
          JSON.stringify({
            category: null,
            subtype: null,
            quantity: 0,
            unit: '',
            confidence: 'low',
            raw_input: '',
            error: "Couldn't parse that — try the form below"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Server-side length limit & sanitization
      const sanitizedInput = rawText.slice(0, 200)

      const extractionPrompt = `
You are an expert NLP parser for CarbonLedger, a carbon tracking app.
Your task is to parse a user's natural language activity into structured fields that pre-fill an existing carbon logging form.

ALLOWED CATEGORIES:
"food" | "transport" | "energy" | "shopping"

ALLOWED SUBTYPES (You MUST use one of these exact keys, DO NOT invent new keys):
- food:
  "vegetables", "chicken", "beef", "dairy", "grains" (also acceptable: "pork", "fish", "eggs", "processed", "fastfood")
- transport:
  "car_petrol", "car_diesel", "car_electric", "motorcycle", "bus", "train", "metro", "cycle", "flight_domestic", "flight_international"
- energy:
  "electricity", "gas", "heating"
- shopping:
  "clothing", "electronics", "furniture", "books" (also acceptable: "appliances", "toys", "sports", "beauty", "jewelry")

UNITS EXPECTED:
- food: "kg" (portion size in kg, default 0.3 if not specified)
- transport: "km" (distance in km, convert miles if needed where 1 mi = 1.6 km)
- energy: "units" or "kWh" (quantity of units or hours used, e.g. "3 hours of AC" -> 3)
- shopping: "units" (item count, default 1)

TRANSPORT DISTANCE & ROUND-TRIP RULES:
- When the input describes a one-way distance PLUS a return trip (phrases like "and back", "round trip", "there and back", "round-trip", "return"):
  The extracted quantity for transport distance MUST be the TOTAL distance traveled (stated one-way distance × 2), not just the stated one-way number.
  * Example 1: "drove 40km to office and back" -> quantity: 80 (40km each way × 2 = 80km total)
  * Example 2: "took the train 25km to town and back" -> quantity: 50 (25km × 2 = 50km total)
  * Example 3: "went 15km there and back by electric car" -> quantity: 30 (15km × 2 = 30km total)
- When the input describes ONLY a one-way trip without return phrasing (e.g. "drove 40km to the office", "10km bus ride"):
  The extracted quantity MUST remain the exact stated number (e.g. 40, 10). Do NOT double it unless return phrasing is present.

SCHEMA REQUIREMENTS:
Return ONLY a valid JSON object matching this schema:
{
  "category": "food" | "transport" | "energy" | "shopping" | null,
  "subtype": string | null,
  "quantity": number | null,
  "unit": string | null,
  "confidence": "high" | "medium" | "low",
  "raw_input": string,
  "description": string,
  "details": {
    "isOrganic": boolean,
    "isLocal": boolean,
    "isGreenTariff": boolean,
    "isSecondhand": boolean,
    "passengers": number,
    "from": string,
    "to": string
  }
}

CONFIDENCE GUIDELINES:
- "high": Unambiguous activity with clear category, recognizable subtype, and identifiable distance/portion/quantity or clear standard quantity.
- "medium": Clear category and subtype, but quantity or specific variant was inferred/assumed.
- "low": Ambiguous, missing critical details (e.g. "had some food", "went outside", "used power", "bought stuff"), or completely unrecognized/gibberish. In this case, set "category": null and "confidence": "low".

DO NOT guess or invent facts if the input is ambiguous.

User text to parse:
"${sanitizedInput}"
`.trim()

      const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-flash-lite-latest']
      let geminiResponse: Response | null = null
      let lastErrorText = ''

      for (const model of modelsToTry) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`
        geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: extractionPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            }
          })
        })

        if (geminiResponse.ok) {
          break
        }

        lastErrorText = await geminiResponse.text()
        console.warn(`Model ${model} failed (${geminiResponse.status}): ${lastErrorText}`)
      }

      if (!geminiResponse || !geminiResponse.ok) {
        const status = geminiResponse?.status || 500
        if (status === 429 || lastErrorText.includes("RESOURCE_EXHAUSTED") || lastErrorText.includes("rate limit")) {
          return new Response(JSON.stringify({ error: `RESOURCE_EXHAUSTED: ${lastErrorText}` }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        throw new Error(`Gemini API failed: ${lastErrorText}`)
      }

      const geminiData = await geminiResponse.json()
      const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim()
      
      let parsedResult: any
      try {
        parsedResult = JSON.parse(cleanJson)
      } catch {
        parsedResult = {
          category: null,
          subtype: null,
          quantity: 0,
          unit: '',
          confidence: 'low',
          raw_input: sanitizedInput,
          error: "Couldn't parse that — try the form below"
        }
      }

      // Ensure fallback properties exist
      if (!parsedResult.raw_input) parsedResult.raw_input = sanitizedInput
      if (!parsedResult.confidence) parsedResult.confidence = parsedResult.category ? 'medium' : 'low'

      return new Response(
        JSON.stringify({
          ...parsedResult,
          parsed: parsedResult,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Fetch ALL Context Data simultaneously for maximum speed (Chat / Cards mode)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      { data: entries },
      { data: challenges },
      { data: household },
      { data: analytics }
    ] = await Promise.all([
      supabaseClient.from('entries').select('co2_kg, category, logged_at').eq('user_id', user.id).gte('logged_at', thirtyDaysAgo.toISOString()),
      
      // 👇 THIS IS THE FIX: We tell Supabase to fetch the progress AND the matching challenge title/description!
      supabaseClient.from('user_challenges').select('*, challenges(title, description)').eq('user_id', user.id),
      
      // Keeping the household_members table name correct for your schema
      supabaseClient.from('household_members').select('*, households(*)').eq('user_id', user.id).maybeSingle(),
      
      supabaseClient.from('user_stats').select('*').eq('user_id', user.id).maybeSingle()
    ])

    const totalEmissions = entries?.reduce((sum, item) => sum + (Number(item.co2_kg) || 0), 0) || 0;

    // 4. Construct the Master System Prompt based on request type
    let systemPrompt = '';
    
    if (type === 'cards') {
      systemPrompt = `
        You are an analytical engine. Review the user's carbon data. 

        Output ONLY a valid JSON object with exactly three keys: 
        'pattern' (a 1-sentence observation about their habits), 
        'action' (a highly specific 1-sentence reduction tip), and 
        'forecast' (a 1-sentence projection of their month-end total). 
        Do not include markdown formatting like \`\`\`json.
        
        --- USER DATA SNAPSHOT ---
        - Total 30-day Emissions: ${totalEmissions.toFixed(1)} kg
        - Recent Entries: ${JSON.stringify(entries || [])}
        - Active Challenges: ${JSON.stringify(challenges || [])}
        - Household Profile: ${JSON.stringify(household || {})}
        - Analytics & Streaks: ${JSON.stringify(analytics || {})}
        --------------------------
      `
    } else {
      systemPrompt = `
        You are the elite AI assistant for CarbonLedger.
        The user's total carbon footprint for the last 30 days is ${totalEmissions.toFixed(1)} kg.
        
        Analyze the following secure user data to answer their query. Provide highly personalized, actionable advice based ONLY on these facts.
        
        --- USER DATA SNAPSHOT ---
        - Recent Entries: ${JSON.stringify(entries || [])}
        - Active Challenges: ${JSON.stringify(challenges || [])}
        - Household Profile: ${JSON.stringify(household || {})}
        - Analytics & Streaks: ${JSON.stringify(analytics || {})}
        --------------------------

        If a data section is empty, you can gently encourage the user to fill out that section in their dashboard. Be concise, brilliant, and friendly.
        
        User query: ${query}
      `
    }

    // 5. Call Gemini API with fallback models
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-flash-lite-latest']
    let geminiResponse: Response | null = null
    let lastErrorText = ''

    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      })

      if (geminiResponse.ok) {
        break
      }

      lastErrorText = await geminiResponse.text()
      console.warn(`Chat model ${model} failed (${geminiResponse.status}): ${lastErrorText}`)
    }

    if (!geminiResponse || !geminiResponse.ok) {
      const status = geminiResponse?.status || 500
      if (status === 429 || lastErrorText.includes("RESOURCE_EXHAUSTED") || lastErrorText.includes("rate limit")) {
        return new Response(JSON.stringify({ error: `RESOURCE_EXHAUSTED: ${lastErrorText}` }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`Gemini API failed: ${lastErrorText}`)
    }

    const geminiData = await geminiResponse.json()
    const aiText = geminiData.candidates[0].content.parts[0].text

    // 6. Return Response
    return new Response(JSON.stringify({ response: aiText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("❌ Edge Function Error:", error.message)
    const isRateLimit = error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("rate limit");
    const isAuthError = error.message.includes("Authorization") || error.message.includes("rejected the token");
    const status = isRateLimit ? 429 : isAuthError ? 401 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})