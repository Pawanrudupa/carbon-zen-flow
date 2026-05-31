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

    // 3. Fetch ALL Context Data simultaneously for maximum speed
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

    // 5. Call Gemini 2.5 Flash
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      const status = geminiResponse.status
      if (status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("rate limit")) {
        return new Response(JSON.stringify({ error: `RESOURCE_EXHAUSTED: ${errorText}` }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`Gemini API failed: ${errorText}`)
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
    const status = isRateLimit ? 429 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})