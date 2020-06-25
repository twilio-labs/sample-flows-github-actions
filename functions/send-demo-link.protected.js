const DEMOS = [
  'https://www.twilio.com/code-exchange/studio-github-actions',
  'https://www.twilio.com/code-exchange/voice-notifications',
  'https://www.twilio.com/code-exchange/sendgrid-email-events',
];

exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();
  const demoNumber = parseInt(event.Digits, 10);
  const demoLink = DEMOS[demoNumber - 1];
  try {
    await client.messages.create({
      from: event.From,
      to: event.To,
      body: `Thanks for joining. Here's the demo you requested! ${demoLink}`,
    });
  } catch (err) {
    console.error(err);
    return callback('We could not send the message');
  }

  callback(null);
};
