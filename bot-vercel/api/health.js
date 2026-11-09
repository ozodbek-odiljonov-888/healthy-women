export default {
  fetch(request) {
    if(request.method!=="GET")return Response.json({error:"Method not allowed"},{status:405,headers:{"cache-control":"no-store"}});
    return Response.json({ok:true,app:"Healthy Women Bot",patient_data_stored:false,reminders_enabled:false},{headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
  }
};
