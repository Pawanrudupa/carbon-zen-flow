import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Resend } from "https://esm.sh/resend@3.2.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    // 1. Parse the incoming Webhook payload from Supabase
    const payload = await req.json()
    const newEntry = payload.record // This is the exact row that was just inserted

    // Only trigger the alert if it's a "Big Entry" (e.g., more than 15kg)
    // You can adjust this threshold based on your app's logic!
    if (!newEntry || Number(newEntry.impact_kg) < 15) {
      return new Response(JSON.stringify({ message: "Entry too small to trigger alert. Ignored." }), { status: 200 })
    }

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Find the users to notify
    // In a real app, you would filter by `household_id`. 
    // For now, we find everyone who has the toggle ON, EXCEPT the person who logged it.
    const { data: users, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, report_email')
      .eq('notify_household_activity', true)
      .not('report_email', 'is', null)
      .neq('id', newEntry.user_id) // Don't email the person who just logged it!

    if (userError) throw userError
    if (!users || users.length === 0) {
       return new Response(JSON.stringify({ message: "No users opted in for household alerts" }), { status: 200 })
    }

    // 4. Build the Alert Email
    const htmlReport = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; border-top: 4px solid #F59E0B;">
        <h2 style="color: #F59E0B;">Carbon Zen: Activity Alert 🔔</h2>
        <p>A member of your squad just logged a major carbon entry.</p>
        
        <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">
            <strong>Category:</strong> ${newEntry.category.charAt(0).toUpperCase() + newEntry.category.slice(1)}
          </p>
          <p style="margin: 0; font-size: 16px;">
            <strong>Impact:</strong> <span style="color: #EF4444; font-weight: bold;">+${Number(newEntry.impact_kg).toFixed(1)} kg CO₂</span>
          </p>
        </div>

        <p style="color: #71717a; font-size: 14px;">Can you offset this? Log a positive green action today to balance the squad's footprint!</p>
        
        <p style="color: #71717a; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
          You are receiving this because you enabled Household Activity alerts.
        </p>
      </div>
    `;

    // 5. Blast the emails
    for (const user of users) {
      await resend.emails.send({
        from: 'Carbon Zen Alerts <onboarding@resend.dev>', // Keep testing email for now
        to: user.report_email,
        subject: '⚠️ Squad Activity Alert: High Footprint Logged',
        html: htmlReport,
      });
    }

    return new Response(JSON.stringify({ message: "Alerts fired successfully" }), { status: 200 })

  } catch (error) {
    console.error("Critical Webhook Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})