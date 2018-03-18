// 1. 功能函数测试
Monitor.push(new Error('test push'));
Monitor.submit(new Error('test submit'));

// 2. 普通错误测试
document.getElementById('btn').addEventListener('click', function (e) {
  btnClick;
})

// 3. 测试 setTiemout
Monitor.tryJS.wrapTimeout();
setTimeout(() => {
  sT
}, 2000);

// 4. 测试包裹自定义函数
var testFunc = function() {
  customFunc
}

testFunc = Monitor.tryJS.wrapCustom(testFunc);
testFunc();

// 5. 测试包裹 Promise
var p1 = new Promise(function (resolve, reject) {
  if(1>0) {
    resolve('Promise success')
  }else {
    reject('Promise error')
  }
}) ;
p1.then(function() {
  throw new Error("Without tryJS.wrapPromise, this error will be not handled anywhere.");
});

Monitor.tryJS.wrapPromise();
var p2 = new Promise(function (resolve, reject) {
  if(1>0) {
    resolve('Promise success')
  }else {
    reject('Promise error')
  }
}) ;
p2.then(function() {
  throw new Error("This error will be handled in the monitor. But catch will be useless");
}).catch(function(error) {
  Monitor.push('catch error: ', error)
  // Show error message to user
  // This code should manually report the error for it to be logged on the server, if applicable.
});
