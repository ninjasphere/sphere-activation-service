module.exports = {
  activation: {
    lock_failed: {
    	type: 'activation_lock_failed',
    	code:409,
    	message:'You may only activate one node at a time. Please wait a moment and try again.'
    },
    already_activated: {
    	type: 'activation_already_activated',
    	code:409,
    	message:'This node has already been activated. If you are having problems, try deactivating it and then repairing.'
    },
    invalid_serial: {
    	type: 'activation_invalid_serial',
    	code:400,
    	message:'Invalid Node ID. It must be an alphanumeric string between 6 and 254 characters.'
    },
    timeout: {
    	type: 'activation_timeout',
    	code:408,
    	message:'No user claimed the node within the specified time. Please try again.'
    },
  },

  authentication: {
  	invalid_token: {
    	type: 'authentication_invalid_token',
    	code:400,
    	message:'Invalid authenication token provided.'
    },
    invalid_user: {
    	type: 'authentication_invalid_user',
    	code:400,
    	message:'Invalid user object provided.'
    },
  },

  unknown_error: { type: 'unknown_error', code:500, message:'An unknown internal error occurred.'},
  internal_error: { type: 'internal_error', code:500, message:'An unspecified internal error occurred.'},
  not_supported: { type: 'not_supported', code:400, message:'This endpoint is not supported.'},
};
