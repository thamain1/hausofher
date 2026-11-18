/* Haus of Her — join-the-list endpoint
   POST /api/join  { "email": "...", "company": "" (honeypot) }
   1. notifies latasha@hausofher.org of the signup
   2. sends the subscriber a branded welcome email
   SendGrid API key lives in the SENDGRID_API_KEY worker secret (never in repo). */

const ALLOWED_ORIGINS = ['https://hausofher.org', 'https://www.hausofher.org'];

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function sendgrid(env, { to, subject, text, html, replyTo }) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.FROM_EMAIL, name: 'Haus of Her' },
      ...(replyTo ? { reply_to: { email: replyTo } } : {}),
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });
  return res.ok || res.status === 202;
}

const WELCOME_HTML = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F6EFE5;">
  <div style="max-width:560px;margin:0 auto;padding:48px 32px;font-family:Georgia,'Times New Roman',serif;color:#1D110A;">
    <div style="text-align:center;padding-bottom:28px;">
      <img src="https://hausofher.org/assets/logo.png" alt="Haus of Her crest" width="110" style="display:block;margin:0 auto;">
    </div>
    <h1 style="font-size:30px;font-weight:400;text-align:center;letter-spacing:.04em;margin:0 0 18px;">Welcome to the <em>Haus</em>.</h1>
    <p style="font-size:16px;line-height:1.7;text-align:center;margin:0 0 14px;">
      You're on the list — first word on new chapters, tickets, and gatherings where women are honored, empowered, and respected.
    </p>
    <p style="font-size:16px;line-height:1.7;text-align:center;margin:0 0 26px;">
      Next up: <strong>Fuel HER Fire — A Vision Board Party</strong>, January 17, 2027 in Lincoln, Nebraska.
    </p>
    <div style="text-align:center;padding-bottom:30px;">
      <a href="https://hausofhervision.rsvpify.com/" style="display:inline-block;padding:13px 34px;border:1px solid #1D110A;color:#1D110A;text-decoration:none;font-size:13px;letter-spacing:.22em;text-transform:uppercase;">Get tickets</a>
    </div>
    <p style="font-size:13px;line-height:1.6;text-align:center;color:#8a7a6d;margin:0;">
      No noise. Only chapters.<br>
      <a href="https://hausofher.org" style="color:#A9604F;text-decoration:none;">hausofher.org</a>
    </p>
  </div>
</body></html>`;

const WELCOME_TEXT = `Welcome to the Haus.

You're on the list — first word on new chapters, tickets, and gatherings where women are honored, empowered, and respected.

Next up: Fuel HER Fire — A Vision Board Party, January 17, 2027, Lincoln, NE.
Tickets: https://hausofhervision.rsvpify.com/

No noise. Only chapters.
https://hausofher.org`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, cors);

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: 'bad_json' }, 400, cors);
    }

    // honeypot: real users never fill this; bots get a fake success
    if ((data.company || '').trim()) return json({ ok: true }, 200, cors);

    const email = (data.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return json({ ok: false, error: 'invalid_email' }, 400, cors);
    }

    const notified = await sendgrid(env, {
      to: env.NOTIFY_EMAIL,
      replyTo: email,
      subject: 'New Haus of Her list signup',
      text: `${email} joined the Haus list.`,
      html: `<p style="font-family:Georgia,serif;font-size:16px;"><strong>${email}</strong> joined the Haus list.</p>`,
    });

    const welcomed = await sendgrid(env, {
      to: email,
      replyTo: env.NOTIFY_EMAIL,
      subject: 'Welcome to the Haus',
      text: WELCOME_TEXT,
      html: WELCOME_HTML,
    });

    if (!notified || !welcomed) return json({ ok: false, error: 'send_failed' }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};
