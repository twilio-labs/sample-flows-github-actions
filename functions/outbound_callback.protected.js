exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();
  const supabase = require('@supabase/supabase-js').createClient(
    context.SUPABASE_URL,
    context.SUPABASE_API_KEY
  );

  const { CallStatus, customerCallSid, callerName, fromNumber } = event;
  const operatorId = JSON.parse(event.operatorId);
  const direction = 'outbound'

  console.log("operatorId", operatorId)

  let error;

  switch (CallStatus) {
    case 'ringing': {
      const { error: ringingError } = await supabase
        .from('calls')
        .update(
          {
            call_status: 'Ringing',
            from_number: fromNumber,
            caller_name: callerName,
            direction: direction
          })
        .eq('call_sid', customerCallSid)
      error = ringingError;
      break;
    }

    case 'in-progress': {
      await client
        .calls(customerCallSid)
        .userDefinedMessages.create({
          content: JSON.stringify({ inProgress: true }),
        });

      const { error: answeredError } = await supabase
        .from('calls')
        .update({ call_status: 'In-progress', operator: operatorId })
        .eq('call_sid', customerCallSid);
      error = answeredError;
      break;
    }

    default:
      const { error: availablityError } = await supabase
        .from('call_operators')
        .update({ status: 'available', designated_call_sid: null })
        .eq('id', operatorId)
        .eq('designated_call_sid', customerCallSid);
      error = availablityError
      break;
  }

  if (error) {
    console.error('Error logging call:', error);
    const detailedError = JSON.stringify(
      error,
      Object.getOwnPropertyNames(error)
    );
    return callback(detailedError);
  }

  return callback(null);
};