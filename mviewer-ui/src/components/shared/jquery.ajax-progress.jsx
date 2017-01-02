import $ from 'jquery';
(function($, window) {
    //is onprogress supported by browser?
  const hasOnProgress = ('onprogress' in $.ajaxSettings.xhr());

    //If not supported, do nothing
  if (!hasOnProgress) {
    return;
  }

    //patch ajax settings to call a progress callback
  const oldXHR = $.ajaxSettings.xhr;
  $.ajaxSettings.xhr = function() {
    let xhr = oldXHR();
    if(xhr instanceof window.XMLHttpRequest) {
      xhr.addEventListener('progress', this.progress, false);
    }

    if(xhr.upload) {
      xhr.upload.addEventListener('progress', this.progress, false);
    }

    return xhr;
  };
})($, window);