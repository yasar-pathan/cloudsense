const twilio = require('twilio');

let twilioClient = null;

/**
 * Get or create Twilio client singleton
 * @returns {import('twilio').Twilio}
 */
const getTwilioClient = () => {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
};

module.exports = { getTwilioClient };
