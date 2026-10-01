const crypto = require('crypto');

const TESTFLIGHT_URL = 'https://testflight.apple.com/join/HdPZ8KR8';

// ============================================================
// STANDARD ERROR RESPONSE
// ============================================================

function sendError(res, httpStatus, code, message, detail = null) {
  return res.status(httpStatus).json({
    ok: false,
    error: true,
    error_code: code,
    message,
    detail
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {

  // ============================================================
  // 01 — WRONG REQUEST METHOD
  // ============================================================

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return sendError(
      res,
      405,
      'BETA_405',
      'This action could not be completed. Please try again.'
    );
  }

  const {
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    RESEND_API_KEY
  } = process.env;

  // ============================================================
  // 02 — SERVER CONFIGURATION ERROR
  // ============================================================

  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !RESEND_API_KEY) {

    console.error('BETA_CONFIG_500 — Missing environment variables');

    return sendError(
      res,
      500,
      'BETA_CONFIG_500',
      'Beta access is temporarily unavailable. Please contact an administrator.'
    );
  }

  const body = req.body || {};
  const id = String(body.id || '').trim();

  // ============================================================
  // 03 — APPLICATION ID MISSING
  // ============================================================

  if (!id) {
    return sendError(
      res,
      400,
      'BETA_ID_400',
      'No waitlist application was selected.'
    );
  }

  try {

    // ============================================================
    // 04 — LOAD WAITLIST APPLICATION
    // ============================================================

    const lookupResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/waitlist?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`
        }
      }
    );

    if (!lookupResponse.ok) {

      const detail = await lookupResponse.text();

      console.error(
        'BETA_DATABASE_READ_502',
        lookupResponse.status,
        detail
      );

      return sendError(
        res,
        502,
        'BETA_DATABASE_READ_502',
        'We could not load this waitlist application. Please try again.',
        detail
      );
    }

    const applications = await lookupResponse.json();
    const application = applications?.[0];

    // ============================================================
    // 05 — APPLICATION NOT FOUND
    // ============================================================

    if (!application) {
      return sendError(
        res,
        404,
        'BETA_APPLICATION_404',
        'This waitlist application could not be found.'
      );
    }

    // ============================================================
    // 06 — ALREADY INVITED
    // ============================================================

    if (application.status === 'beta_invited') {
      return sendError(
        res,
        409,
        'BETA_ALREADY_INVITED_409',
        'This person has already been invited to the Innerlist Beta.'
      );
    }

    // ============================================================
    // 07 — ALREADY ACTIVE
    // ============================================================

    if (application.status === 'beta_active') {
      return sendError(
        res,
        409,
        'BETA_ALREADY_ACTIVE_409',
        'This person already has active Innerlist Beta access.'
      );
    }

    const email = String(application.email || '')
      .trim()
      .toLowerCase();

    const fullName = String(application.full_name || '').trim();

    // ============================================================
    // 08 — EMAIL MISSING
    // ============================================================

    if (!email) {
      return sendError(
        res,
        400,
        'BETA_EMAIL_MISSING_400',
        'This application does not contain an email address.'
      );
    }

    // ============================================================
    // 09 — GENERATE INVITATION
    // ============================================================

    const inviteCode = crypto
      .randomBytes(24)
      .toString('hex');

    const now = new Date().toISOString();

    // ============================================================
    // 10 — UPDATE DATABASE
    // ============================================================

    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/waitlist?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          status: 'beta_invited',
          invite_code: inviteCode,
          beta_selected_at: now,
          updated_at: now
        })
      }
    );

    if (!updateResponse.ok) {

      const detail = await updateResponse.text();

      console.error(
        'BETA_DATABASE_UPDATE_502',
        updateResponse.status,
        detail
      );

      return sendError(
        res,
        502,
        'BETA_DATABASE_UPDATE_502',
        'Beta access could not be saved. No invitation was sent.',
        detail
      );
    }

    // ============================================================
    // 11 — PREPARE EMAIL
    // ============================================================

    const firstName = fullName.split(' ')[0] || 'there';

    const language =
      application.language === 'tr'
        ? 'tr'
        : 'en';

    const subject =
      language === 'tr'
        ? "Innerlist Beta'ya davetlisiniz."
        : "You're invited to Innerlist Beta.";

    const intro =
      language === 'tr'
        ? `
          <p style="font-size:18px;line-height:1.7;color:#d8d0c2;">
            Merhaba ${escapeHtml(firstName)},
          </p>

          <p style="font-size:18px;line-height:1.7;color:#d8d0c2;">
            Innerlist'in ilk beta üyelerinden biri olmak üzere seçildiniz.
          </p>

          <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin-bottom:34px;">
            Innerlist Beta'ya erken erişim sağlayan küçük grubun bir parçasısınız.
            Aşağıdaki bağlantı üzerinden TestFlight ile uygulamayı yükleyebilirsiniz.
          </p>
        `
        : `
          <p style="font-size:18px;line-height:1.7;color:#d8d0c2;">
            Hi ${escapeHtml(firstName)},
          </p>

          <p style="font-size:18px;line-height:1.7;color:#d8d0c2;">
            You've been selected to be one of the first members of Innerlist Beta.
          </p>

          <p style="font-size:18px;line-height:1.7;color:#d8d0c2;margin-bottom:34px;">
            You're part of the small group receiving early access to Innerlist.
            Install the beta through TestFlight below.
          </p>
        `;

    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="
  margin:0;
  padding:0;
  background:#102019;
  font-family:Georgia,serif;
  color:#f2eadc;
">

  <div style="
    max-width:600px;
    margin:0 auto;
    padding:64px 28px;
  ">

    <div style="
      font-family:Arial,sans-serif;
      font-size:12px;
      letter-spacing:3px;
      color:#c9aa72;
      margin-bottom:60px;
    ">
      INNERLIST
    </div>

    <h1 style="
      font-size:42px;
      line-height:1.05;
      font-weight:400;
      margin:0 0 28px;
      color:#f2eadc;
    ">
      You're invited.
    </h1>

    ${intro}

    <a
      href="${TESTFLIGHT_URL}"
      style="
        display:inline-block;
        background:#f2eadc;
        color:#102019;
        text-decoration:none;
        font-family:Arial,sans-serif;
        font-size:12px;
        font-weight:600;
        letter-spacing:2px;
        padding:17px 28px;
        border-radius:2px;
      "
    >
      JOIN INNERLIST BETA
    </a>

    <p style="
      font-family:Arial,sans-serif;
      font-size:12px;
      line-height:1.6;
      color:#a9a194;
      margin:18px 0 0;
    ">
      You'll need Apple's TestFlight app installed on your iPhone or iPad.
    </p>

    <div style="
      height:1px;
      background:#806d4c;
      margin:48px 0;
    "></div>

    <p style="
      font-size:14px;
      line-height:1.7;
      color:#a9a194;
      margin:0;
    ">
      A thousand moments.<br>
      When you're on the Innerlist.
    </p>

  </div>

</body>
</html>
`;

    // ============================================================
    // 12 — SEND EMAIL THROUGH RESEND
    // ============================================================

    const resendResponse = await fetch(
      'https://api.resend.com/emails',
      {
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
      }
    );

    // ============================================================
    // 13 — EMAIL FAILED
    // ============================================================

    if (!resendResponse.ok) {

      const detail = await resendResponse.text();

      console.error(
        'BETA_EMAIL_SEND_502',
        resendResponse.status,
        detail
      );

      /*
       * IMPORTANT:
       * Database already says beta_invited at this point.
       * Therefore we explicitly tell the admin that access was
       * created but the email failed.
       */

      return sendError(
        res,
        502,
        'BETA_EMAIL_SEND_502',
        'Beta access was created, but the invitation email could not be sent.',
        detail
      );
    }

    // ============================================================
    // 14 — MARK EMAIL AS SENT
    // ============================================================

    const sentAt = new Date().toISOString();

    const sentUpdateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/waitlist?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          invite_sent_at: sentAt,
          updated_at: sentAt
        })
      }
    );

    // ============================================================
    // 15 — EMAIL SENT BUT DATABASE CONFIRMATION FAILED
    // ============================================================

    if (!sentUpdateResponse.ok) {

      const detail = await sentUpdateResponse.text();

      console.error(
        'BETA_SENT_STATUS_502',
        sentUpdateResponse.status,
        detail
      );

      return sendError(
        res,
        502,
        'BETA_SENT_STATUS_502',
        'The invitation email was sent, but its sent status could not be saved.',
        detail
      );
    }

    // ============================================================
    // SUCCESS
    // ============================================================

    return res.status(200).json({
      ok: true,
      error: false,
      code: 'BETA_INVITE_SUCCESS',
      message: `Beta invitation sent successfully to ${email}.`,
      application: {
        id,
        email,
        full_name: fullName,
        status: 'beta_invited',
        invite_sent_at: sentAt
      }
    });

  } catch (error) {

    // ============================================================
    // UNEXPECTED SERVER ERROR
    // ============================================================

    console.error(
      'BETA_UNEXPECTED_500',
      error
    );

    return sendError(
      res,
      500,
      'BETA_UNEXPECTED_500',
      'An unexpected error occurred while granting beta access.'
    );
  }
};
