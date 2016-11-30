import $ from 'jquery';

var path = '../services/';

function setupServicePath() {
  if (ENV && ENV != 'prod') {
    path = 'http://localhost:8080/mViewer-1.0/services/';
  }
}

setupServicePath();

function service(typex, serviceName, req , component, data) {
  if (component == 'fileUpload'){
    return $.ajax({
      type: typex,
      url: path + serviceName,
      dataType: 'json',
      headers: {
        Accept: "application/json"
      },
      data: req,
      processData: false,
      contentType: false,
      progress: function(e) {
        if(e.lengthComputable) {
          data.percent = (e.loaded / e.total) * 100;
        }
      }
    });
  }
  else if(component == 'download') {
  	window.open(path + serviceName);
  }
  else if(component == 'query'){
  	return $.ajax({
      type: typex,
      cache: false,
      dataType: 'json',
      headers: {
        'Content-type': 'application/json'
      },
      crossDomain: true,
      url: path + serviceName,
      data : req
    });
  }
  else{
  	return $.ajax({
      type: typex,
      cache: false,
      dataType: 'json',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      },
      crossDomain: true,
      url: path + serviceName,
      data : req
    });
  }
}


export default service;
