export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    RESEND_API_KEY
  } = process.env;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !RESEND_API_KEY) {
    console.error('Missing environment variables');
    return res.status(500).json({
      error: 'Server configuration is incomplete.'
    });
  }

  const body = req.body || {};

  const full_name = String(body.full_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const occupation = body.occupation
    ? String(body.occupation).trim()
    : null;
  const instagram = body.instagram
    ? String(body.instagram).trim()
    : null;

  const membership_interest = ['inner', 'innerly', 'innerlist'].includes(
    body.membership_interest
  )
    ? body.membership_interest
    : 'innerly';

  const language = ['en', 'tr'].includes(body.language)
    ? body.language
    : 'en';

  const consent = body.consent === true;

  if (
    full_name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !consent
  ) {
    return res.status(400).json({
      error: 'Please complete the required fields.'
    });
  }

  try {
    // 1. SAVE TO SUPABASE
    const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        full_name,
        email,
        occupation,
        instagram,
        membership_interest,
        consent,
        language
      })
    });

    if (!response.ok) {
      const detail = await response.text();

      if (response.status === 409 || detail.includes('23505')) {
        return res.status(409).json({
          error: 'This email is already on the waitlist.',
          code: 'ALREADY_ON_WAITLIST'
        });
      }

      console.error(
        'Supabase waitlist error:',
        response.status,
        detail
      );

      return res.status(502).json({
        error: 'Could not save your registration.'
      });
    }

    // 2. SEND CONFIRMATION EMAIL WITH RESEND
    const firstName = full_name.split(' ')[0];

    const subject =
      language === 'tr'
        ? "Innerlist'e hoş geldin."
        : "You're on the Innerlist.";

    const emailHtml =
      language === 'tr'
        ? `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#102019;font-family:Georgia,serif;color:#f2eadc;">
  <div style="max-width:600px;margin:0 auto;padding:64px 28px;">

    <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;color:#c9aa72;margin-bottom:60px;">
      INNERLIST
    </div>

    <h1 style="font-size:42px;line-height:1.05;font-weight:400;margin:0 0 28px;color:#f2eadc;">
      You're on the list.
    </h1>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      Merhaba ${escapeHtml(firstName)},
    </p>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      Innerlist waitlist başvurunu aldık.
    </p>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      Her başvuruyu tek tek inceliyoruz. Beta erişimi önce küçük bir gruba açılacak; ardından listedeki herkes lansmanda bizimle olacak.
    </p>

    <div style="height:1px;background:#806d4c;margin:48px 0;"></div>

    <p style="font-size:14px;line-height:1.7;color:#a9a194;margin:0;">
      A thousand moments.<br>
      When you're on the Innerlist.
    </p>

    <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;color:#806d4c;margin-top:50px;">
      INNERLIST · ISTANBUL
    </p>

  </div>
</body>
</html>
`
        : `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#102019;font-family:Georgia,serif;color:#f2eadc;">
  <div style="max-width:600px;margin:0 auto;padding:64px 28px;">

    <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;color:#c9aa72;margin-bottom:60px;">
      INNERLIST
    </div>

    <h1 style="font-size:42px;line-height:1.05;font-weight:400;margin:0 0 28px;color:#f2eadc;">
      You're on the list.
    </h1>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      Hi ${escapeHtml(firstName)},
    </p>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      We've received your Innerlist waitlist application.
    </p>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      We read every application. Beta access will open first to a small group, and everyone on the list will join us at launch.
    </p>

    <div style="height:1px;background:#806d4c;margin:48px 0;"></div>

    <p style="font-size:14px;line-height:1.7;color:#a9a194;margin:0;">
      A thousand moments.<br>
      When you're on the Innerlist.
    </p>

    <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;color:#806d4c;margin-top:50px;">
      INNERLIST · ISTANBUL
    </p>

  </div>
</body>
</html>
`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Innerlist <contact@innerlist.house>',
        to: [email],
        subject,
        html: emailHtml
      })
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();

      console.error(
        'Resend email error:',
        resendResponse.status,
        resendError
      );

      // Registration is already safely stored in Supabase.
      // We do NOT fail the registration if the email fails.
      return res.status(201).json({
        ok: true,
        email_sent: false
      });
    }

    return res.status(201).json({
      ok: true,
      email_sent: true
    });

  } catch (error) {
    console.error('Waitlist API error:', error);

    return res.status(500).json({
      error: 'Could not save your registration.'
    });
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
