import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Resend } from "https://esm.sh/resend@3.2.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    // 1. Parse the incoming Webhook payload
    const payload = await req.json()
    const newEntry = payload.record 

    if (!newEntry || !newEntry.user_id) {
      return new Response(JSON.stringify({ message: "No entry record found." }), { status: 400 })
    }

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Get the user's profile to check preferences and actual target
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('report_email, notify_goal_achieved, monthly_target')
      .eq('id', newEntry.user_id)
      .single()

    if (userError || !user) throw new Error("User not found")
    
    // If notifications disabled or no email, stop immediately.
    if (!user.notify_goal_achieved || !user.report_email) {
      return new Response(JSON.stringify({ message: "User opted out of goal alerts" }), { status: 200 })
    }

    const monthlyTarget = Number(user.monthly_target) || 350;

    // 4. Calculate total for the CURRENT month
    const now = new Date();
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const { data: monthEntries, error: entriesError } = await supabaseAdmin
      .from('entries')
      .select('co2_kg')
      .eq('user_id', newEntry.user_id)
      .gte('logged_at', firstDayOfMonth)

    if (entriesError) throw entriesError

    let currentMonthTotal = 0;
    monthEntries?.forEach(entry => {
      currentMonthTotal += (Number(entry.co2_kg) || 0);
    });

    // 5. Evaluate Budget Threshold (Carbon Emissions Cap)
    const newEntryImpact = Number(newEntry.co2_kg) || 0;
    const totalBeforeThisEntry = currentMonthTotal - newEntryImpact;

    const crossedLimit = (totalBeforeThisEntry < monthlyTarget) && (currentMonthTotal >= monthlyTarget);
    const crossedWarning = (totalBeforeThisEntry < (monthlyTarget * 0.8)) && (currentMonthTotal >= (monthlyTarget * 0.8));

    if (!crossedLimit && !crossedWarning) {
      return new Response(JSON.stringify({ message: "No threshold crossed. No email sent." }), { status: 200 });
    }

    const isLimitBreached = crossedLimit;
    const appUrl = Deno.env.get('APP_URL') ?? 'https://carbon-zen-flow.vercel.app';
    const subject = isLimitBreached 
      ? "⚠️ Carbon Limit Reached: Monthly budget exceeded"
      : "⚡ Carbon Alert: You've reached 80% of your monthly budget";

    const htmlReport = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 25px; border-radius: 12px; background: #ffffff; border: 1px solid #fee2e2; border-top: 5px solid #ef4444;">
        <h2 style="color: #b91c1c; margin-top: 0;">${isLimitBreached ? "Monthly Limit Reached 🛑" : "Approaching Monthly Limit ⚠️"}</h2>
        <p style="color: #374151; font-size: 15px;">
          ${isLimitBreached 
            ? "Your latest entry pushed your monthly emissions past your target budget."
            : "You have used 80% of your carbon emission budget for this month."}
        </p>
        <div style="background: #fef2f2; padding: 18px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #7f1d1d; text-transform: uppercase; font-weight: bold;">Current Total vs Target</p>
          <p style="margin: 6px 0 0 0; font-size: 32px; font-weight: 800; color: #dc2626;">
            ${currentMonthTotal.toFixed(1)} <span style="font-size: 16px; color: #6b7280;">/ ${monthlyTarget} kg CO₂</span>
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Tip: Consider choosing public transit, plant-forward meals, or reducing energy consumption for the remainder of the month to stabilize your footprint.
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${appUrl}/dashboard" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Carbon Dashboard</a>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
          You are receiving this because you enabled Carbon Budget alerts in your Carbon Zen settings.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: 'Carbon Zen Alerts <onboarding@resend.dev>',
      to: user.report_email,
      subject,
      html: htmlReport,
    });

    return new Response(JSON.stringify({ message: "Budget alert email sent successfully" }), { status: 200 })

  } catch (error) {
    console.error("Critical Webhook Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
