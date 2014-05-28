module.exports = {
  activation: {
    lock_failed: { code:409, message:'You may only activate one node at a time. Please wait a moment and try again.' },
    already_activated: { code:409, message:'This node has already been activated. If you are having problems, try deactivating it and then repairing.' },
    invalid_serial: { code:400, message:'Invalid Node ID. It must be an alphanumeric string between 6 and 254 characters.' },
    timeout: { code:408, message:'No user claimed the node within the specified time. Please try again.' },
  },

  unknown_error: { code:500, message:'An unknown internal error occurred.'},
  not_supported: { code:400, message:'This endpoint is not supported.'},
};
