function postError(url, data, callback) {
  var xhr = null;
  if (window.XMLHttpRequest) {
    xhr = new XMLHttpRequest();
  } else if (window.ActiveXObject) { // IE 6 and older
    xhr = new ActiveXObject("Microsoft.XMLHTTP");
  }

  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      callback(xhr.responseText)
    }
  };
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
}

if(window.Monitor) {
  /* 错误监控 */
  Monitor.init({
    sampling: 1, // 采样率 (0, 1] 1-全量
    repeat: 1, // 同一错误最大重复次数（超过该次数的错误会被过滤）
    delay: 1000, // 延迟上报,
    // 错误提交函数
    reporter: function(logList) {
      console.log('Monitor reporter: ', logList);
      var ua = navigator.userAgent;
      var href = location.href;
      var plateform = (/micromessenger/i).test(ua) 
                      ? '微信'
                      : (/isWebview/i).test(href)
                        ? '客户端'
                        : '普通浏览器';
      var params = {
        'msg': JSON.stringify(logList),
        'ua': ua,
        'plateform': plateform
      };
      var url = '/exceptionLog';
      postError(url,params,function(){})
    }
  });
  Monitor.tryJS.wrapTimeout();
  Monitor.tryJS.wrapPromise();
}else {
  console.log('[init-monitor.js] need load monitor.js first');
}