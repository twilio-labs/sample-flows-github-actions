
exports.handler = async function (context, event, callback) {
  const { createClient } = require('@supabase/supabase-js');
  const client = context.getTwilioClient();

  const supabase = createClient(
    context.SUPABASE_URL,
    context.SUPABASE_API_KEY
  );

  const { CallSid, operatorId, customerCallSid } = event

  console.log('dequeue_callback event: ', event)

  const { data: callData, error: callError } = await supabase
    .from('calls')
    .select('caller_name, from_number')
    .eq('call_sid', CallSid)
    .single();

  console.log('DATA', callData)

  const userDefinedMessage = await client
    .calls(customerCallSid)
    .userDefinedMessages.create({
      content: JSON.stringify({ callerName: callData.caller_name, fromNumber: callData.from_number }),
    });

  const { error } = await supabase
    .from('calls')
    .update({ call_status: 'In-progress', operator: operatorId })
    .eq('call_sid', CallSid)

  if (error) {
    console.error('Error updating dequeued call status:', error);
    const detailedError = JSON.stringify(
      error,
      Object.getOwnPropertyNames(error)
    );
    return callback(detailedError);
  }

  // Two parties about to be connected
  return callback(null, '<Response></Response>');
};