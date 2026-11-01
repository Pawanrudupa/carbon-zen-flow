import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Resend } from "https://esm.sh/resend@3.2.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req: Request) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Check if we are running a manual test from the terminal
    const url = new URL(req.url);
    const forceTest = url.searchParams.get('test') === 'true';

    // 2. Find ALL users who opted into the daily reminder
    const { data: users, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, report_email, notify_daily_time')
      .eq('notify_daily_reminder', true)
      .not('report_email', 'is', null)

    if (userError) throw userError

    let usersToEmail = users || [];

    // 3. The Time Check Engine
    // Compare hour-level UTC to support half-hour timezones (e.g., IST UTC+5:30)
    if (!forceTest) {
      const now = new Date();
      const currentHour = String(now.getUTCHours()).padStart(2, '0'); 
      usersToEmail = usersToEmail.filter(u => u.notify_daily_time?.split(':')[0] === currentHour);
    }

    if (usersToEmail.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders scheduled for this hour." }), { status: 200 })
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'https://carbon-zen-flow.vercel.app';
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'CarbonZen <onboarding@resend.dev>';

    // 4. Build and send the emails
    for (const user of usersToEmail) {
      const htmlReport = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #eee; border-radius: 12px; background: #fafafa;">
          <h2 style="color: #10B981; margin-top: 0;">CarbonZen: Daily Check-In 🌿</h2>
          <p style="color: #3f3f46; font-size: 16px;">Just a quick reminder to log your footprint for today!</p>
          
          <div style="text-align: center; margin: 35px 0;">
             <a href="${appUrl}/log" style="background-color: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Log Today's Impact</a>
          </div>
          
          <p style="color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7; padding-top: 15px;">
            You are receiving this because you scheduled a daily reminder for ${user.notify_daily_time}.
          </p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: user.report_email,
          subject: '🌿 Time to log your daily CarbonZen impact!',
          html: htmlReport,
        });
        console.log(`Daily reminder sent to: ${user.report_email}`);
      } catch (sendErr) {
        console.error(`Failed sending daily reminder to ${user.report_email}:`, sendErr);
      }
    }

    return new Response(JSON.stringify({ message: "Daily reminders processed successfully", count: usersToEmail.length }), { status: 200 })

  } catch (error: any) {
    console.error("Critical Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
