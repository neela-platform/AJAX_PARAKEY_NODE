const axios = require('axios');

// Load config from environment variables
const AJAX_INTEGRATION_ID = process.env.AJAX_INTEGRATION_ID;
const AJAX_API_KEY = process.env.AJAX_API_KEY;
const AJAX_BASE_URL = process.env.AJAX_BASE_URL;
const PARAKEY_WEBHOOK_SECRET = process.env.PARAKEY_WEBHOOK_SECRET;

// Validate environment variables
function validateEnvironmentVariables() {
  const required = {
    AJAX_BASE_URL,
    AJAX_INTEGRATION_ID,
    AJAX_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
// Function to unarm the Ajax system
async function unarmAjaxSystem() {
  try {
    // Validate environment variables before making the request
    validateEnvironmentVariables();

    const url = `${AJAX_BASE_URL}/v1/integrations/${AJAX_INTEGRATION_ID}/control/unarm`;

    console.log('Making request to URL:', url); // Debug log

    const response = await axios.post(
      url,
      {},
      {
        headers: {
          'X-Api-Key': AJAX_API_KEY,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to unarm Ajax system: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    console.error('Error in unarmAjaxSystem:', {
      message: error.message,
      url: `${AJAX_BASE_URL}/v1/integrations/${AJAX_INTEGRATION_ID}/control/unarm`,
      baseUrl: AJAX_BASE_URL,
      integrationId: AJAX_INTEGRATION_ID,
    });
    throw error;
  }
}

// Export the serverless function
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // ↓↓↓ ADDED: explicit JSON parsing with error handling
    let eventData;
    try {
      eventData =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (err) {
      console.error('Error parsing JSON body:', err);
      res.status(400).send('Bad Request - Invalid JSON');
      return;
    }

    // Check if the event indicates a door unlock
    if (eventData.event === 'door_unlocked') {
      console.log('Door unlocked event received from Parakey:', eventData);
      await unarmAjaxSystem();
      console.log('Ajax system unarmed successfully.');
    }

    // Respond to Parakey
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Parakey webhook:', error);
    // Send a more detailed error message during development
    res.status(500).json({
      error: error.message,
      details: {
        baseUrl: AJAX_BASE_URL,
        integrationId: AJAX_INTEGRATION_ID,
      },
    });
  }
};
