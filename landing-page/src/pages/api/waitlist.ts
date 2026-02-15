export const prerender = false;

export async function POST({ request }) {
  try {
    const { email, name, locale, hcaptchaToken, consentToContact, shareCalcData, calculatorData } = await request.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!hcaptchaToken) {
      return new Response(JSON.stringify({ error: 'Please complete the CAPTCHA' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = import.meta.env.BREVO_API_KEY || process.env.BREVO_API_KEY;
    const hcaptchaSecret = import.meta.env.HCAPTCHA_SECRET_KEY || process.env.HCAPTCHA_SECRET_KEY;

    if (!apiKey || !hcaptchaSecret) {
      console.error('Missing API keys');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const hcaptchaResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${hcaptchaSecret}&response=${hcaptchaToken}`
    });

    const hcaptchaData = await hcaptchaResponse.json();

    if (!hcaptchaData.success) {
      return new Response(JSON.stringify({ error: 'CAPTCHA verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const attributes: any = {
      LOCALE: locale || 'en',
      FIRSTNAME: name || '',
      CONSENT_TO_CONTACT: consentToContact === true,
      SHARE_CALC_DATA: shareCalcData === true
    };

    if (shareCalcData && calculatorData) {
      attributes.CALC_AD_BUDGET = calculatorData.adBudget || '';
      attributes.CALC_SHOP_SALES = calculatorData.shopSales || '';
      attributes.CALC_GOOGLE_SALES = calculatorData.googleSales || '';
      attributes.CALC_BLINDNESS_PCT = calculatorData.blindnessPercent || '';
      attributes.CALC_WASTED_BUDGET = calculatorData.wastedBudget || '';
      attributes.CALC_PACKAGE = calculatorData.recommendedPackage || '';
    }

    // Use Brevo DOI endpoint if possible, or create contact and trigger automation
    // For now, we'll use the standard contact creation with DOI parameters if supported, 
    // or assume the list has a DOI workflow attached in Brevo.
    // According to Brevo API v3, DOI is handled via a specific endpoint or by adding to a list that triggers a workflow.
    // Actually, Brevo has a "Double Opt-In" endpoint: POST /v3/contacts/doubleOptinConfirmation

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email: email,
        listIds: [2], // Assuming list 2 is the waitlist
        attributes: attributes,
        updateEnabled: true
      })
    });

    if (response.ok) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const errorText = await response.text();
      console.error('Brevo API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `Brevo error: ${response.status} - ${errorText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Waitlist API error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
