exports.handler = async function (context, event, callback) {
    const supabase = require('@supabase/supabase-js').createClient(
      context.SUPABASE_URL,
      context.SUPABASE_API_KEY
    );
  
    const twiml = new Twilio.twiml.VoiceResponse();
  
    const dialCallStatus = event.DialCallStatus; // 'completed', 'no-answer', 'busy', 'failed', etc.
    const customerCallSid = event.customerCallSid;
    const operatorId = event.operatorId;
    const fromNumber = event.fromNumber;
    const callerName = event.callerName
  
    // Operator didn't answer
    if (operatorId && (['no-answer', 'busy', 'failed', 'canceled'].includes(dialCallStatus))) {
      let newStatus = 'available';
  
      // Update operator status in Supabase
      const { data, error } = await supabase
        .from('call_operators')
        .update({ status: newStatus, designated_call_sid: null })
        .eq('id', operatorId)
        .eq('designated_call_sid', customerCallSid);
  
      if (error) {
        console.error('Error updating operator status:', error);
        const detailedError = JSON.stringify(error, Object.getOwnPropertyNames(error))
        // TODO: redirect call to fallback
        return callback(detailedError);
      }
  
      // Operator didn't answer; try the next operator
      // Get the excludeOperatorIds from the query parameters
      let excludeOperatorIds = event.excludeOperatorIds ? JSON.parse(event.excludeOperatorIds) : [];
  
      // Redirect back to the incoming call handler to try the next operator
      twiml.redirect({
        method: 'POST',
      }, `${context.TWILIO_SERVER_URL}/assign_operator?excludeOperatorIds=${encodeURIComponent(JSON.stringify(excludeOperatorIds))}&customerCallSid=${encodeURIComponent(customerCallSid)}&fromNumber=${encodeURIComponent(fromNumber)}&callerName=${encodeURIComponent(JSON.stringify(callerName))}`);
  
    }
    
    return callback(null, twiml);
  };
  
  