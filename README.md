Monitor: 前端 JS 异常监控
---

## [demo（请开启 Chrome DevTool）](http://demo.qpdiy.com/chulinyin/monitorDemo/)

### To do
- [ ] 测试该库的兼容性（Android、ios、webView、Chrome、Firefox、IE、Edge、Safari）
- [ ] 添加 level 字段，定义错误级别
- [ ] jQuery 的 ajax 回调中的错误处理（目前$.ajax() 后 then 的回调中的报错 window.onerror 无法获取到）
- [ ] 主动解析 sourceMap 文件

### Getting Started
> 该库之前的错误代码无法被监听，因此该库最好在所有 js 引入之前加载并初始化。

> 若需监听引入的跨域第三方库（如 CDN 引入）中的报错，请使用 `<script crossorigin src="https://cdn....">`

#### 初始化
```javascript
window.Monitor && Monitor.init({
  sampling: 1,  // 采样率 (0, 1] 1-全量
  repeat: 2,    // 同一错误最大重复次数（超过该次数的错误会被过滤）
  delay: 1000,  // 延迟上报,
  // 错误回调, 可用于组装错误日志，上传至服务器
  reporter: function(logList) {
    console.log('Monitor reporter: ', logList);
  }
});
```

亦可参考 `init-monitor.js` 中的初始化方式，将错误发送给后端。

#### 手动提交(立即)
```javascript
Monitor.submit("error message");

Monitor.submit({
  msg: 'error message',   // 错误信息
  file: 'xx.js',          // 错误来源 js
  row: 10,                // 错误行
  col: 1                  // 错误列
});

try {
  throw new Error('test')
} catch(error) {
  Monitor.submit(error)
}
```

#### 延迟提交
```javascript
Monitor.push("error message");

Monitor.push({
  msg: 'error message',   // 错误信息
  file: 'xx.js',          // 错误来源 js
  row: 10,                // 错误行
  col: 1                  // 错误列
});

try {
  throw new Error('test')
} catch(error) {
  Monitor.push(error)
}
```

### 高级用法（见 demo）

#### 包裹自定义函数
```javascript
var testFunc = function() {
  customFunc
}

testFunc = Monitor.tryJS.wrapCustom(testFunc);
testFunc();
```

#### 包裹系统延时函数（setTimeout, setInterval）
```javascript
Monitor.tryJS.wrapTimeout();
setTimeout(() => {
  sT
}, 2000);
```

#### 包裹 Promise (use carefully)
```javascript
// Without [tryJS.wrapPromise], this error will be not handled anywhere.
var p1 = new Promise(function (resolve, reject) {
  if(1>0) {
    resolve('Promise success')
  }else {
    reject('Promise error')
  }
}) ;
p1.then(function() {
  throw new Error("Without [tryJS.wrapPromise], this error will be not handled anywhere.");
});

// without [tryJS.wrapPromise], this error will be handled in the monitor, 
// but catch will be useless， because error will not come in Promise.catch forever
Monitor.tryJS.wrapPromise();
var p2 = new Promise(function (resolve, reject) {
  if(1>0) {
    resolve('Promise success')
  }else {
    reject('Promise error')
  }
}) ;
p2.then(function() {
  throw new Error("without [tryJS.wrapPromise], this error will be handled in the monitor, but catch will be useless");
}).catch(function(error) {
  // with [tryJS.wrapPromise], error will not come in catch forever
  console.log(error)
});
```

### 灵感来源
- [javascript-errors](https://github.com/mknichel/javascript-errors)
- [Capture and report JavaScript errors with window.onerror](https://blog.sentry.io/2016/01/04/client-javascript-reporting-window-onerror.html)
- [前端代码异常日志收集与监控](http://www.cnblogs.com/hustskyking/p/fe-monitor.html)
- [Debugging Production JavaScript](https://medium.com/javascript-scene/debugging-production-javascript-469668ba247b)
- [MDN: GlobalEventHandlers.onerror](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror)
- [badjs-report](https://github.com/BetterJS/badjs-report)
- [jstracker: JavaScript stack trace](https://github.com/CurtisCBS/monitor)
