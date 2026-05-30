import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Resend } from "https://esm.sh/resend@3.2.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    // 1. Parse the incoming Webhook payload
    const payload = await req.json()
    const newEntry = payload.record 

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Get the user's profile to check their preferences and their actual target
    // Note: We assume you have a 'monthly_target' column. If not, we default to 50 for this example!
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('report_email, notify_goal_achieved, monthly_target') // Add monthly_target to your DB if you haven't!
      .eq('id', newEntry.user_id)
      .single()

    if (userError || !user) throw new Error("User not found")
    
    // If they have the toggle OFF, stop immediately.
    if (!user.notify_goal_achieved || !user.report_email) {
      return new Response(JSON.stringify({ message: "User opted out of goal alerts" }), { status: 200 })
    }

    const monthlyTarget = user.monthly_target || 50; // Fallback to 50 if they haven't set one

    // 4. Calculate their total for the CURRENT month
    const now = new Date();
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const { data: monthEntries, error: entriesError } = await supabaseAdmin
      .from('entries')
      .select('impact_kg')
      .eq('user_id', newEntry.user_id)
      .gte('logged_at', firstDayOfMonth)

    if (entriesError) throw entriesError

    // Sum up everything they have logged this month
    let currentMonthTotal = 0;
    monthEntries?.forEach(entry => {
      currentMonthTotal += (Number(entry.impact_kg) || 0);
    });

    // 5. SPAM PREVENTION: Did this *specific* entry push them over the edge?
    // We subtract the new entry to see what their total was BEFORE they hit save.
    const newEntryImpact = Number(newEntry.impact_kg) || 0;
    const totalBeforeThisEntry = currentMonthTotal - newEntryImpact;

    // If they were already over the target yesterday, don't email them again today!
    const justCrossedFinishLine = (totalBeforeThisEntry < monthlyTarget) && (currentMonthTotal >= monthlyTarget);

    if (!justCrossedFinishLine) {
      return new Response(JSON.stringify({ message: "Goal not crossed on this exact entry. No email sent." }), { status: 200 })
    }

    // 6. Build the Celebration Email
    const htmlReport = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 30px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center; background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);">
        <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
        <h2 style="color: #059669; margin-top: 0;">Target Achieved!</h2>
        <p style="color: #3f3f46; font-size: 16px;">Incredible work. You just hit your monthly Carbon Zen target!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <p style="margin: 0; color: #71717a; text-transform: uppercase; font-size: 12px; font-weight: bold; letter-spacing: 1px;">Current Month Total</p>
          <p style="margin: 5px 0 0 0; font-size: 36px; font-weight: 900; color: #10B981;">
            ${currentMonthTotal.toFixed(1)} <span style="font-size: 16px; font-weight: normal; color: #71717a;">/ ${monthlyTarget}</span>
          </p>
        </div>

        <p style="color: #71717a; font-size: 14px;">You are crushing it. Let's see how far past the goal you can push it before the month ends!</p>
        
        <p style="color: #a1a1aa; font-size: 11px; margin-top: 40px;">
          You are receiving this because you enabled Goal Celebrations in your Carbon Zen settings.
        </p>
      </div>
    `;

    // 7. Blast the email
    await resend.emails.send({
      from: 'Carbon Zen Celebrations <onboarding@resend.dev>',
      to: user.report_email,
      subject: '🎉 You hit your monthly target!',
      html: htmlReport,
    });

    return new Response(JSON.stringify({ message: "Celebration email fired!" }), { status: 200 })

  } catch (error) {
    console.error("Critical Webhook Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})