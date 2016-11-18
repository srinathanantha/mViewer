const success = {
	"response":{
		"result":{
			"success":true,
			"connectionId":"1_839292641"
		}
	}
};

const failure = {
	"response":{
		"error":{
			"success":false,
			"connectionId":""
		}
	}
};

export default function service(typex, serviceName, req , component, data) {
	console.log(req, req.host, req.port);
  return new Promise((resolve, reject) => {
    const isValidReq = req.host && req.port;
    process.nextTick(
      () => isValidReq ? resolve(success) : reject(failure)
    );
  });
}