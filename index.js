require('dotenv').config();
const axios = require('axios');

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const FORM_ID = process.env.FORM_ID;
const FORWARD_URL = process.env.FORWARD_URL;
let lastTimestamp = Date.now() - 1000 * 60 * 60; // Default: check last hour

async function pollExecutionFormSubmissions() {
  try {
    const response = await axios.get(
      `https://api.hubapi.com/form-integrations/v1/submissions/forms/${FORM_ID}?limit=10`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        },
      }
    );

    const submissions = response.data.results || [];

    for (const submission of submissions) {
      const submittedAt = submission.submittedAt;
      if (submittedAt <= lastTimestamp) continue;

      const emailField = submission.values.find(
        (v) => v.name === 'email'
      )?.value;

      if (emailField) {
        await axios.post(FORWARD_URL, {
          email: emailField,
          raw: submission,
        });
        console.log(`Forwarded submission from: ${emailField}`);
      }
    }

    lastTimestamp = Date.now();
  } catch (error) {
    console.error('Polling failed:', error.response?.data || error.message);
  }
}

pollExecutionFormSubmissions();
