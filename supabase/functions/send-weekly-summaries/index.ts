import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Resend } from "https://esm.sh/resend@3.2.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Find all users who opted into WEEKLY summaries
    // Notice we are checking the new database column here!
    const { data: users, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, report_email')
      .eq('notify_weekly_summary', true)
      .not('report_email', 'is', null)

    if (userError) throw userError

    console.log(`Found ${users.length} users opted in for weekly summaries.`)

    if (users.length === 0) {
       return new Response(JSON.stringify({ message: "No users to process" }), { status: 200 })
    }

    // 3. Calculate date range for the LAST 7 DAYS
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const startDate = sevenDaysAgo.toISOString();
    const endDate = now.toISOString();

    // 4. Loop through users and generate reports
    for (const user of users) {
      
      const { data: entries, error: entriesError } = await supabaseAdmin
        .from('entries') 
        .select('category, co2_kg') 
        .eq('user_id', user.id)
        .gte('logged_at', startDate)
        .lte('logged_at', endDate);

      if (entriesError) {
        console.error(`Error fetching entries for user ${user.id}:`, entriesError);
        continue; 
      }

      let weeklyTotal = 0;

      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          weeklyTotal += (Number(entry.impact_kg) || 0);
        });
      }

      // Build HTML Email
      const htmlReport = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10B981;">Carbon Zen: Weekly Digest 📅</h2>
          <p>Happy Monday! Here is a quick look at your footprint over the last 7 days.</p>
          
          <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">7-Day Total</p>
            <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold; color: #18181b;">
              ${weeklyTotal.toFixed(1)} <span style="font-size: 16px; font-weight: normal; color: #71717a;">kg CO₂</span>
            </p>
          </div>

          ${weeklyTotal === 0 ? '<p style="color: #F59E0B;"><em>No entries logged this week. Time to build that streak!</em></p>' : ''}
          
          <div style="text-align: center; margin-top: 25px;">
             <a href="https://your-app-url.com" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log Today's Impact</a>
          </div>

          <p style="color: #71717a; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            You are receiving this because you enabled Weekly Summaries in your Carbon Zen settings.
          </p>
        </div>
      `;

      // Send via Resend
      const resendResponse = await resend.emails.send({
        from: 'Carbon Zen Reports <onboarding@resend.dev>', // Keep testing email for now
        to: user.report_email,
        subject: 'Your Weekly Carbon Digest 📅',
        html: htmlReport,
      });
      
      if (resendResponse.error) {
        console.error(`Resend blocked email to ${user.report_email}:`, resendResponse.error);
      } else {
        console.log(`Weekly digest sent to: ${user.report_email}`);
      }
    }

    return new Response(JSON.stringify({ 
      message: "Weekly summaries sent", 
      processed: users?.length
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Critical Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})