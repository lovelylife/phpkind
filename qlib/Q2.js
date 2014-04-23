/*-------------------------------------------------------
 $ name:  loader
 $ function: Q frame work do some initialize
 $ date: 2011-4-6
 $ author: lovelylife
---------------------------------------------------------*/

// 初始化 Javascript Loader
(function() {

  window.undefined = window.undefined;

    // check the name is used
    if(window.Q) {
        alert('conflict name for Q');
        return;
    }
    
    //! Q
    window.Q = Q = this;
  //! QLib base dir
  var _libdir = null;
    // dom elements cache
    var _domcache = {};    
    //! OnPageLoad Message Queue
    var _OnPageLoad = [];
  //! QueryString
  var _querystring = {};
  //! Browser
  var _Browser = {};

  var _delayDOMReady = [];

  //! class creator
    this.KLASS = function() {
        return function() {
        this._initialize.apply(this, arguments);  
      };
    };
  
  this.ELEMENT_NODE = 1;
  this.ELEMENT_TEXTNODE = 3;

  // default ie mouse button
  this.LBUTTON  = 1;
  this.RBUTTON  = 2;
  this.MBUTTON  = 4;

  // debug
  this._DEBUG    = {
    enable: false,    // 开启debug功能
    stdoutput: null    // 输出
  };

  // get Element from dom cache if exists
  this.$ = function(id, bOverride) {
    if(typeof(id) != 'string') { return id; }
    var element = null;
    if(!_domcache[id] || bOverride) {
      element = document.getElementById(id);
      if(element) {
        _domcache[id] = element;
      }
    } else {
      element = _domcache[id];
    }
    return element;
  };

  this.DelayLoad = function() {
    while(_delayDOMReady.length > 0) { _delayDOMReady.shift()(); }
  };
    
  // 兼容ff的attachEvent接口
  this.addEvent = function(obj, evtName, fnHandler, useCapture) {
    obj = Q.$(obj);
    if(obj.addEventListener) {
      obj.addEventListener(evtName, fnHandler, !!useCapture);
    } else if(obj.attachEvent) {
      obj.attachEvent('on'+evtName, fnHandler);
    } else {
      oTarget["on" + evtName] = fnHandler;
    }
  };

  this.removeEvent = function(obj, evtName, fnHandler) {
    obj = Q.$(obj); 
    if (obj.removeEventListener) {
      obj.removeEventListener(evtName, fnHandler, false);
    } else if (obj.detachEvent) {
      obj.detachEvent("on" + evtName, fnHandler);
    } else { 
      obj["on" + evtName] = null;
    }
  };

  // 获取element的绝对位置
  this.absPosition = function(element) {
    var w = element.offsetWidth;
    var h = element.offsetHeight;
    var t = element.offsetTop;
    var l = element.offsetLeft;
    while( element = element.offsetParent) {
      t+=element.offsetTop;
      l+=element.offsetLeft;
    }
    return { width : w, height : h,  left : l,  top : t  };
  };

  // get scroll info
  this.scrollInfo = function() {
    var t, l, w, h;
    if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft) ) { 
      t = document.documentElement.scrollTop;
      l = document.documentElement.scrollLeft; 
      w = document.documentElement.scrollWidth;         
      h = document.documentElement.scrollHeight;     
    } else if (document.body) {         
      t = document.body.scrollTop;         
      l = document.body.scrollLeft;
      w = document.body.scrollWidth;         
      h = document.body.scrollHeight;     
    }
    return { t: t, l: l, w: w, h: h };
  };

  // 解析地址页面的查询字段
  function doParseUrlQuery() {
    var querystring = location.search.toString();
    querystring = querystring.substring(1, querystring.length);
    var queryMap = querystring.split('&');
    for(var i=0; i < queryMap.length; i++) {
      var t = queryMap[i].split('=');
      if(t.length != 2) { continue; }
      _querystring[t[0]] = t[1];
    }
  };
  //! document.createElement
  this.createElement = document.createElement;
  //! QLib Dir
  this.libDir = function() { return _libdir; };
  //! get querystring
  this.GET = function(key) { return _querystring[key]; };
  this.querystring = function(arrExcepts) {
    if(arrExcepts) {
      var e = _querystring;
      for(var i=0; i<arrExcepts.length; i++) {
        delete e[arrExcepts[i]];
      }

      var str = '';
      for(var name in e) {
        str += '&'+name+'='+e[name];
      }
      
      return str.substring(1, str.length);    
    }    
  };
  // OnLoad
  this.DOMReady = function(evt) {
    Q.delayDOMReady();
  };
  // 当所有脚本都加载后开始执行Ready回调
  this.delayDOMReady = function() {
    while(_OnPageLoad.length > 0) { _OnPageLoad.shift()(); }
  };

  //! push event when document loaded
    this.Ready = function(f) { _OnPageLoad.push(f); };

  // current Q.js所在路径
  Q.__DIR__ = function() {
    var js=document.scripts;
    js=js[js.length-1].src.substring(0,js[js.length-1].src.lastIndexOf("/")+1);
    return js;
  };

  // print debug info to 'stdoutput' element
  Q.printf = function(message) {
    if(Q._DEBUG.enable) {
      Q._DEBUG.stdoutput.innerHTML += '<br/>'+message;
      Q._DEBUG.stdoutput.scrollTop = Q._DEBUG.stdoutput.scrollHeight;
    }
  };

  // enable/disable debug
  Q.debug = function(enable) {
    Q._DEBUG.enable = enable;
  };

  Q.setdebug = function(output) {
    if(Q._DEBUG.stdoutput) {
      if(Q._DEBUG.stdoutput.nodeName == Q.ELEMENT_NODE) {
        
      }
    }
    Q._DEBUG.stdoutput = output;
  }

  function Initialize() {
    //! get Browser
    _Browser.agt = navigator.userAgent.toLowerCase();
    _Browser.isW3C = document.getElementById ? true:false;
    _Browser.isIE = ((_Browser.agt.indexOf("msie") != -1) && (_Browser.agt.indexOf("opera") == -1) && (_Browser.agt.indexOf("omniweb") == -1));
    _Browser.isOpera = _Browser.agt.indexOf("opera") != -1;
    _Browser.isNS6 = _Browser.isW3C && (navigator.appName=="Netscape");
    //为Firefox下的DOM对象增加innerText属性
    if(_Browser.isNS6) { //firefox innerText define
      HTMLElement.prototype.__defineGetter__( "innerText",
        function(){  return this.textContent;  }
      );
      HTMLElement.prototype.__defineSetter__( "innerText",
        function(sText){ this.textContent=sText; }
      );

      HTMLElement.prototype.__defineGetter__("currentStyle", 
        function () {
          //getComputedStyle 目标对象，属性。
          //return this.ownerDocument.defaultView.getComputedStyle(this, ":first-line");
          return this.ownerDocument.defaultView.getComputedStyle(this, null);
        }
      );
      // 兼容ff，ie的鼠标按键值
      Q.LBUTTON  = 0;
      Q.MBUTTON  = 1;
    }
    doParseUrlQuery();
    Q.addEvent(window, 'load', Q.DOMReady);  
  }

  // initialize
  Initialize();
})();
