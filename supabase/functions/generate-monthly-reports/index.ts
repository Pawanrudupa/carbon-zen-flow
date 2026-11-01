import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Resend } from "https://esm.sh/resend@3.2.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req: Request) => {
  try {
    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Find all users who opted into auto-reports
    const { data: users, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, report_email')
      .eq('auto_generate_reports', true)
      .not('report_email', 'is', null)

    if (userError) throw userError

    console.log(`Found ${users?.length || 0} users opted in for reports.`)

    // 3. Calculate date range for PREVIOUS month
    const now = new Date();
    const firstDayLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
    const lastDayLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999)).toISOString();
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'CarbonZen <onboarding@resend.dev>';

    // 4. Loop through users
    for (const user of (users || [])) {
      const { data: entries, error: entriesError } = await supabaseAdmin
        .from('entries') 
        .select('category, co2_kg')
        .eq('user_id', user.id)
        .gte('logged_at', firstDayLastMonth)
        .lte('logged_at', lastDayLastMonth);

      if (entriesError) {
        console.error(`Error fetching entries for user ${user.id}:`, entriesError);
        continue; 
      }

      let totalEmissions = 0;
      const categoryTotals: Record<string, number> = {};

      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          const impact = Number(entry.co2_kg) || 0;
          totalEmissions += impact;
          categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + impact;
        });
      }

      let topCategory = 'None';
      let highestImpact = 0;
      for (const [category, impact] of Object.entries(categoryTotals)) {
        if (impact > highestImpact) {
          highestImpact = impact;
          topCategory = category.charAt(0).toUpperCase() + category.slice(1);
        }
      }

      // Build HTML Report
      const htmlReport = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10B981;">CarbonZen: Monthly Impact 🌍</h2>
          <p>Your automated monthly carbon report is ready.</p>
          
          <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 16px;">
              <strong>Total Footprint:</strong> ${totalEmissions.toFixed(1)} kg CO₂
            </p>
            <p style="margin: 0; font-size: 16px;">
              <strong>Highest Category:</strong> ${topCategory} (${highestImpact.toFixed(1)} kg CO₂)
            </p>
          </div>

          ${totalEmissions === 0 ? '<p style="color: #F59E0B;"><em>It looks like you didn\'t log any entries last month. Ready to get back on track?</em></p>' : ''}
          
          <p style="color: #71717a; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            You are receiving this because you enabled Auto-Reports in your CarbonZen settings.
          </p>
        </div>
      `;

      try {
        const resendResponse = await resend.emails.send({
          from: fromEmail,
          to: user.report_email,
          subject: 'Your Monthly Carbon Impact Report 🌱',
          html: htmlReport,
        });
        
        if (resendResponse.error) {
          console.error(`Resend blocked email to ${user.report_email}:`, resendResponse.error);
        } else {
          console.log(`Report successfully sent to: ${user.report_email}`);
        }
      } catch (sendErr) {
        console.error(`Failed sending monthly report to ${user.report_email}:`, sendErr);
      }
    }

    return new Response(JSON.stringify({ 
      message: "Reports generation complete", 
      processed: users?.length || 0
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error: any) {
    console.error("Critical Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
