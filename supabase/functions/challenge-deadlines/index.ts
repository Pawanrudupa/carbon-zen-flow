import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Resend } from "https://esm.sh/resend@3.2.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find ALL users who opted into alerts
    const { data: users, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, report_email')
      .eq('notify_challenge_deadlines', true)
      .not('report_email', 'is', null)

    if (userError) throw userError
    if (!users || users.length === 0) {
       return new Response(JSON.stringify({ message: "No users opted in." }), { status: 200 })
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000)); 

    let emailsSent = 0;

    // 2. Loop through users
    for (const user of users) {
      
      // Fetch active challenges AND join the duration/title from the main challenges table
      const { data: activeChallenges, error: challengeError } = await supabaseAdmin
        .from('user_challenges') 
        .select(`
          id,
          started_at,
          challenges !inner (
            title, 
            duration_days
          )
        `) 
        .eq('user_id', user.id)
        .is('completed_at', null) // Null means it is still active

      if (challengeError) {
        console.error(`Error fetching challenges for ${user.id}:`, challengeError);
        continue;
      }

      if (!activeChallenges || activeChallenges.length === 0) continue;

      // 3. The Math Engine: Calculate deadlines dynamically
      // Filter the active challenges to find ones expiring between NOW and TOMORROW
      const expiringChallenges = activeChallenges.filter((uc: any) => {
        const startDate = new Date(uc.started_at);
        const durationDays = uc.challenges.duration_days;
        
        // Calculate exact deadline timestamp
        const deadlineDate = new Date(startDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        
        return deadlineDate > now && deadlineDate <= tomorrow;
      });

      if (expiringChallenges.length === 0) continue;

      // 4. Build the Warning Email
      const challengeName = expiringChallenges[0].challenges.title || "your active challenge";

      const htmlReport = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #eee; border-radius: 12px; background: #fff; border-top: 5px solid #EF4444;">
          <h2 style="color: #EF4444; margin-top: 0;">Final 24 Hours! ⏳</h2>
          <p style="color: #3f3f46; font-size: 16px;">Time is almost up to complete <strong>${challengeName}</strong>.</p>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 25px 0; border: 1px solid #fecaca; text-align: center;">
             <p style="margin: 0; font-size: 15px; color: #991b1b;">
               Your challenge expires tomorrow. Can you make a final push to hit the goal?
             </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
             <a href="https://your-app-url.com/challenges" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Complete Challenge</a>
          </div>
          
          <p style="color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7; padding-top: 15px;">
            You are receiving this because you enabled Challenge Deadline alerts in Carbon Zen.
          </p>
        </div>
      `;

      // 5. Fire off the email
      const resendResponse = await resend.emails.send({
        from: 'Carbon Zen Challenges <onboarding@resend.dev>',
        to: user.report_email,
        subject: '⏳ 24 Hours Left: Complete your challenge!',
        html: htmlReport,
      });
      
      if (!resendResponse.error) {
        emailsSent++;
      }
    }

    return new Response(JSON.stringify({ message: "Deadline scanner complete", emailsSent }), { status: 200 })

  } catch (error) {
    console.error("Critical Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})