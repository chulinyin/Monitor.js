/* 
 * created by 褚林银
 * 2018.1.10
 */

(function (global, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory();
  }
  else if (typeof define === 'function' && define.amd) {
    define(factory);
  }
  else if (typeof exports === 'object') {
    exports["Monitor"] = factory();
  }
  else {
    global["Monitor"] = factory();
  }

}(this, (function () {
  'use strict';

  if (window.Monitor) return window.Monitor;

  var _logList = []; // 错误队列
  var _logMap = [];   // 错误数量映射
  var _config = {
    // level: 4, // 错误级别 1-debug 2-info 3-bug 4-error
    sampling: 1, // 采样率 (0, 1] 1-全量
    repeat: 2, // 同一错误最大重复次数（超过该次数的错误会被过滤）
    delay: 1000, // 延迟上报,
    reporter: function (logList) {
      console.log('[Monitor]:', logList);
    } // 错误提交函数
  }

  var utils = {
    isObject: function (obj) {
      return typeof obj === "object" && !!obj;
    },
    isString: function (str) {
      return typeof str === 'string';
    },
    isFunction: function (func) {
      return typeof func === "function";
    },
    extend: function (origin, source) {
      for (var key in source) {
        origin[key] = source[key];
      }
      return origin;
    },
    isRepeat: function (error) {
      if (!utils.isObject(error)) return true;

      var errorKey = error.msg.substr(0, 200);
      _logMap[errorKey] = (parseInt(_logMap[errorKey], 10) || 0) + 1;

      var times = _logMap[errorKey];
      return times > _config.repeat;
    },
    stringifyErrorStack: function (errObj) {
      if (errObj.stack) {
        return errObj.stack.toString();
      } else {
        return errObj.toString();
      }
    },
    formatError: function (error) {
      if (error instanceof Error) {
        var stringifiedStack = utils.stringifyErrorStack(error);
        return {
          msg: (error.message || '') + "@" + stringifiedStack,
          file: error.fileName,
          row: error.lineNumber,
          col: error.columnNumber,
          stack: stringifiedStack
        }
      } else if (utils.isObject(error)) {
        return error
      } else if (utils.isString(error)) {
        return { msg: error }
      } else {
        return { msg: error && error.toString() || '' }
      }
    }
  }

  function _init() {
    console.log('init monitor');
    // 重写 window.oerror
    var orgError = window.onerror;
    window.onerror = function (msg, url, line, col, error) {
      var formatedError = utils.formatError(error);
      utils.extend(formatedError, {
        msg: formatedError.msg || msg,
        file: url,
        row: line,
        col: col,
      })
      _logList.push(formatedError);
      _processLog();
      orgError && orgError.apply(window, arguments);
      return true;
    };

    // 针对 vue 报错重写 console.error
    var orginError = console.error;
    console.error = function () {
      var args = Array.prototype.slice.call(arguments)

      var errorLog = {
        msg: args.toString()
      }
      monitor.push(errorLog)

      return orginError.apply(console, args);
    }
  }

  var submitLogList = [];
  var timeOut = 0;
  // 处理+提交日志
  function _processLog(isSubmitNow) {
    // 是否被抽样率过滤
    var isRandomIgnore = Math.random() >= _config.sampling;

    while (_logList.length) {
      var errLog = _logList.shift();
      // 同类错误过滤 && 抽样率过滤
      if (utils.isRepeat(errLog) || isRandomIgnore) {
        continue;
      } else {
        submitLogList.push(errLog);
      }
    }

    if (isSubmitNow) {
      _submitLog(); // 立即上报
    } else if (!timeOut) {
      timeOut = setTimeout(_submitLog, _config.delay); // 延迟上报
    }
  }

  // 提交日志，清除计时器，清空日志列表
  function _submitLog() {
    clearTimeout(timeOut);
    if (!submitLogList.length) return;

    _config.reporter(submitLogList);

    timeOut = 0;
    submitLogList = [];
  }

  var monitor = {
    init: function (config) {
      _init()

      if (utils.isObject(config)) {
        _config = utils.extend(_config, config)
      }

      // 如果有数据缓存 , 先提交掉
      if (_logList.length) {
        _processLog();
      }

      return monitor;
    },
    // 延迟上报
    push: function (error) {
      var formatedError = utils.formatError(error);
      _logList.push(formatedError);
      _processLog();
    },
    // 手动提交
    submit: function (error) {
      var formatedError = utils.formatError(error);
      _logList.push(formatedError);
      _processLog(true);
    }
  }

  monitor.tryJS = {
    wrapCustom: wrapCustom,
    wrapTimeout: wrapTimeout,
    wrapPromise: wrapPromise
  }

  /**
   * 将自定义函数使用 try..catch 包装
   *
   * @param  {Function} func 需要进行包装的函数
   * @return {Function} 包装后的函数
   */
  function wrapCustom(func) {
    if (!utils.isFunction(func)) return func;

    // 确保只包装一次
    if (!func._wrapped) {
      func._wrapped = function () {
        try {
          return func.apply(this, arguments)
        } catch (error) {
          monitor.push(error)
          // throw error
        }
      };
    }

    return func._wrapped
  }

  /**
   * 将 setTimeout 或 setInterval 函数使用 try..catch 包装
   *
   * @param  {Function} nativeFunc window.setTimeout or window.setInterval
   * @return {Function} 包装后的函数
   */
  function _wrapTimeout(nativeFunc) {
    return function (cb, timeout) {
      // for setTimeout(string, delay)
      if (typeof cb === "string") {
        try {
          cb = new Function(cb);
        } catch (err) {
          throw err;
        }
      }
      var args = [].slice.call(arguments, 2);
      // for setTimeout(function, delay, param1, ...)
      cb = wrapCustom(cb, args.length && args);
      return nativeFunc(cb, timeout);
    };
  };

  // 将 setTimeout 或 setInterval 函数使用 try..catch 包装
  function wrapTimeout() {
    window.setTimeout = _wrapTimeout(window.setTimeout);
    window.setInterval = _wrapTimeout(window.setInterval);
  }

  function wrapPromise() {
    if (!Promise) return;

    var oldPromiseThen = Promise.prototype.then;
    Promise.prototype.then = function wrapedThen(callback, errorHanlder) {
      return oldPromiseThen.call(this, wrapCustom(callback), wrapCustom(errorHanlder))
    }
  }

  return monitor
})));