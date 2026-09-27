async function sendSMS(phone, message) {
  // In a real app, you would use Twilio or Africa's Talking API here.
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({ body: message, from: '+1234567890', to: phone });

  console.log('-----------------------------------------');
  console.log(`[MOCK SMS] To: ${phone}`);
  console.log(`Message: ${message}`);
  console.log('-----------------------------------------');
  
  return true;
}

module.exports = { sendSMS };
