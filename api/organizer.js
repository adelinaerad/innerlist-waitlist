module.exports = async function handler(req, res) {
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

  const organizer_type = String(body.organizer_type || '').trim();
  const organization_name = String(body.organization_name || '').trim();
  const contact_name = String(body.contact_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();

  const website_or_instagram = body.website_or_instagram
    ? String(body.website_or_instagram).trim()
    : null;

  const event_types = Array.isArray(body.event_types)
    ? body.event_types.map(v => String(v).trim()).filter(Boolean)
    : [];

  const expected_guests = String(body.expected_guests || '').trim();
  const event_timing = String(body.event_timing || '').trim();

  const additional_info = body.additional_info
    ? String(body.additional_info).trim()
    : null;

  const language = ['en', 'tr'].includes(body.language)
    ? body.language
    : 'en';

  // VALIDATION
  const allowedOrganizerTypes = [
    'community',
    'event_planner',
    'brand',
    'nightclub'
  ];

  if (
    !allowedOrganizerTypes.includes(organizer_type) ||
    organization_name.length < 2 ||
    contact_name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    event_types.length === 0 ||
    !expected_guests ||
    !event_timing
  ) {
    return res.status(400).json({
      error: 'Please complete the required fields.'
    });
  }

  try {
    // 1. SAVE APPLICATION TO SUPABASE
    const supabaseResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/organizer_applications`,
      {
        method: 'POST',
       headers: {
  'Content-Type': 'application/json',
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  Prefer: 'return=minimal'
},
        body: JSON.stringify({
          organizer_type,
          organization_name,
          contact_name,
          email,
          website_or_instagram,
          event_types,
          expected_guests,
          event_timing,
          additional_info,
          language,
          status: 'pending'
        })
      }
    );

    if (!supabaseResponse.ok) {
      const detail = await supabaseResponse.text();

      console.error(
        'Supabase organizer application error:',
        supabaseResponse.status,
        detail
      );
          return res.status(502).json({
            error: 'Could not save your application.',
            supabase_status: supabaseResponse.status,
           supabase_detail: detail
        });
      }

    // 2. SEND CONFIRMATION EMAIL
    const firstName = contact_name.split(' ')[0];

    const subject =
      language === 'tr'
        ? 'Innerlist organizer başvurunuzu aldık.'
        : 'We received your Innerlist organizer application.';

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
      Başvurunuzu aldık.
    </h1>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      Merhaba ${escapeHtml(firstName)},
    </p>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      ${escapeHtml(organization_name)} için Innerlist organizer başvurunuz bize ulaştı.
    </p>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      Her organizer başvurusunu tek tek inceliyoruz. Ekibimiz başvurunuzu değerlendirdikten sonra sizinle iletişime geçecek.
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
      Application received.
    </h1>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      Hi ${escapeHtml(firstName)},
    </p>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      We've received your Innerlist organizer application for ${escapeHtml(organization_name)}.
    </p>

    <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin:0 0 22px;">
      We review every organizer application individually. Our team will be in touch after reviewing yours.
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
        'Resend organizer email error:',
        resendResponse.status,
        resendError
      );

      // Application is already stored, so don't fail the application.
      return res.status(201).json({
        ok: true,
        application_id: application?.id || null,
        email_sent: false
      });
    }

    return res.status(201).json({
      ok: true,
      application_id: application?.id || null,
      email_sent: true
    });

  } catch (error) {
    console.error('Organizer API error:', error);

    return res.status(500).json({
      error: 'Could not submit your application.'
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
