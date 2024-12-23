
exports.handler = async function (context, event, callback) {
  const supabase = require('@supabase/supabase-js').createClient(
    context.SUPABASE_URL,
    context.SUPABASE_API_KEY
  );

  const { CallSid, Caller, To } = event

  const client = context.getTwilioClient();
  let twiml = new Twilio.twiml.VoiceResponse();

  const operatorId = extractMiddleNumbers(Caller);
  const customerCallSid = CallSid

  let callerName = 'Unknown'
  let fromNumber = To

  if (To !== 'queue') { // Create outbound dial

    const dial = twiml.dial({
      action: `${context.TWILIO_SERVER_URL}/outbound_action?operatorId=${encodeURIComponent(operatorId)}&customerCallSid=${encodeURIComponent(customerCallSid)}`,
      callerId: context.TWILIO_CALLER_ID,
    })

    try {
      // Determine caller name
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name')
        .eq('phone', fromNumber);

      if (clientError) {
        throw clientError;
      }

      if (clientData.length > 0) {
        callerName = clientData[0].name;
      } else {
        const phoneNumber = await client.lookups.v2.phoneNumbers(fromNumber)
          .fetch({ fields: 'caller_name' });
        callerName = phoneNumber.callerName?.caller_name || callerName;
      }

    } catch (error) {
      console.error("Error determining caller name:", error);
    }

    dial.number({
      statusCallbackEvent: 'ringing answered completed',
      statusCallback: `${context.TWILIO_SERVER_URL}/outbound_callback?operatorId=${encodeURIComponent(
        JSON.stringify(operatorId)
      )}&customerCallSid=${encodeURIComponent(customerCallSid)}&fromNumber=${encodeURIComponent(fromNumber)}&callerName=${encodeURIComponent(callerName)}`,
      statusCallbackMethod: 'POST'
    }, To);
    
  } else { // Connect to a queued caller

    const dial = twiml.dial({
      action: `${context.TWILIO_SERVER_URL}/outbound_action?operatorId=${encodeURIComponent(operatorId)}`,
      callerId: context.TWILIO_NUMBER,
      timeout: 2
    })

    twiml.say('Caller hung up')

    // TODO: Test case where someone calls in on operator after they dial into dequeue on client, but before the dequeue callback is executed

    dial.queue({
      url: `${context.TWILIO_SERVER_URL}/dequeue_callback?operatorId=${encodeURIComponent(operatorId)}&customerCallSid=${customerCallSid}`,
    }, 'main');
  }

  const { data: reserveData, error: reserveError } = await supabase.rpc(
    'outbound_assign_operator',
    {
      operator_id: operatorId,
      customer_call_sid: customerCallSid,
      customer_caller_name: callerName,
      customer_from_number: fromNumber,
      customer_call_status: 'Initiated'
    }
  );

  if (reserveError) {
    console.error('Error assigning operator:', reserveError);
    const detailedError = JSON.stringify(
      reserveError,
      Object.getOwnPropertyNames(reserveError)
    );
    return callback(detailedError);
  }

  if (reserveData[0].operator_busy || reserveData[0].call_already_ended) {
    console.error('Operator busy or call already ended');
    return callback(null, '<Response><Hangup/></Response>');
  }

  return callback(null, twiml);
};

function extractMiddleNumbers(inputString) {
  // Define the regex pattern to capture digits between two colons
  const regex = /:(\d+):/;

  // Execute the regex on the input string
  const match = inputString.match(regex);

  // If a match is found, return the captured digits
  if (match && match[1]) {
    return match[1];
  }

  // If no match is found, return null
  return null;
}