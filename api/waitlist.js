export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: 'Server configuration is incomplete.' });
  }

  const body = req.body || {};
  const full_name = String(body.full_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const occupation = body.occupation ? String(body.occupation).trim() : null;
  const instagram = body.instagram ? String(body.instagram).trim() : null;
  const membership_interest = ['inner','innerly','innerlist'].includes(body.membership_interest)
    ? body.membership_interest : 'innerly';
  const language = ['en','tr'].includes(body.language) ? body.language : 'en';
  const consent = body.consent === true;

  if (full_name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !consent) {
    return res.status(400).json({ error: 'Please complete the required fields.' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ full_name, email, occupation, instagram, membership_interest, consent, language })
    });

    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 409 || detail.includes('23505')) {
        return res.status(409).json({ error: 'This email is already on the waitlist.' });
      }
      console.error('Supabase waitlist error:', response.status, detail);
      return res.status(502).json({ error: 'Could not save your registration.' });
    }

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return res.status(500).json({ error: 'Could not save your registration.' });
  }
}
