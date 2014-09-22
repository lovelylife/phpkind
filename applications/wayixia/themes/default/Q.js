/*************** import file Q.js***************/
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
    
  // Q
  var Q = {};
  window.Q = Q;
  // QLib base dir
  var _libdir = null;
  // dom elements cache
  var _domcache = {};    
  // OnPageLoad Message Queue
  var _OnPageLoad = [];
  // QueryString
  var _querystring = {};
  // Browser
  Q.Browser = {};

  // LoadCompleted
  var _LoadCompleted = false;
  var _delayDOMReady = [];

  // 基于prototype的继承实现
	// 警告：调用父类的（被重载的）同名函数调用需要借助this.__super__.method.call(this, arguments);
  var CLASS = function() {};
  CLASS.prototype.extend = function(props) {
    var sup = this.prototype;  
    var sub = function() {
      this.construct.apply(this, arguments);
    };
    
    sub.prototype = Object.create(this.prototype);
    for(var name in props) {
      sub.prototype[name] = props[name];  
    }
    sub.prototype.__super__ = sup;  
    sub.prototype.constructor = sub;
    sub.extend = sub.prototype.extend;
  
		return sub;
  }

	CLASS.extend = function(props) {
    return this.prototype.extend.call(this, props);
  }

	var Q = window.Q = CLASS;

  Q.ELEMENT_NODE = 1;
  Q.ELEMENT_TEXTNODE = 3;

  // default ie mouse button
  Q.LBUTTON  = 1;
  Q.RBUTTON  = 2;
  Q.MBUTTON  = 4;

  // debug
  Q._DEBUG    = {
    enable: false,    // 开启debug功能
    stdoutput: null    // 输出
  };

  // enable/disable debug
  Q.debug = function(enable) { Q._DEBUG.enable = enable; };
  Q.setdebug = function(output) { Q._DEBUG.stdoutput = output; }

  // print debug info to 'stdoutput' element
  Q.printf = function(message) {
    if(Q._DEBUG.enable) {
      Q._DEBUG.stdoutput.innerHTML += '<br/>'+message;
      Q._DEBUG.stdoutput.scrollTop = Q._DEBUG.stdoutput.scrollHeight;
    }
  };

  // get Element from dom cache if exists
  Q.$ = function(id, bOverride) {
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

  Q.bind_handler = function(object, func) {
    return function() {
      return func.apply(object, arguments);
    };
  };

  Q.registerDelayDOMReady = function(f) {
    if(!_LoadCompleted) {
      _delayDOMReady.push(f);
    }
  };

  Q.DelayLoad = function() {
    if(_LoadCompleted) {
      while(_delayDOMReady.length > 0) { _delayDOMReady.shift()(); }
    }
  };
    
  // 兼容ff的attachEvent接口
  Q.addEvent = function(obj, evtName, fnHandler, useCapture) {
    obj = Q.$(obj);
    if(obj.addEventListener) {
      obj.addEventListener(evtName, fnHandler, !!useCapture);
    } else if(obj.attachEvent) {
      obj.attachEvent('on'+evtName, fnHandler);
    } else {
      oTarget["on" + evtName] = fnHandler;
    }
  };

  Q.removeEvent = function(obj, evtName, fnHandler) {
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
  Q.absPosition = function(element) {
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
  Q.scrollInfo = function() {
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

  // QLib Dir
  Q.libDir = function() { return _libdir; };
  // get querystring
  Q.GET = function(key) { return _querystring[key]; };
  Q.querystring = function(arrExcepts) {
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
  Q.DOMReady = function(evt) {
    if(!_LoadCompleted) {
      Q.registerDelayDOMReady(Q.delayDOMReady);
    } else {
      Q.delayDOMReady();
    }        
  };
  
	// 当所有脚本都加载后开始执行Ready回调
  Q.delayDOMReady = function() {
    while(_OnPageLoad.length > 0) { _OnPageLoad.shift()(); }
  };

  // push event when document loaded
  Q.Ready = function(f, push_front) {
    var back = !push_front;
		if(back)
		  _OnPageLoad.push(f); 
		else 
		  _OnPageLoad.unshift(f); 
  };

  // current Q.js所在路径
  Q.__DIR__ = function() {
    var js=document.scripts;
    js=js[js.length-1].src.substring(0,js[js.length-1].src.lastIndexOf("/")+1);
    return js;
  };

  // Javascript Loader
  function jsloader() {
    var scripts = document.getElementsByTagName("script");  
    // 判断指定的文件是否已经包含，如果已包含则触发onsuccess事件并返回  
    var libscript = null;
    for (i = 0; i < scripts.length; i++) {
      if(scripts[i].src) {
        var pos = -1;
        if((pos=scripts[i].src.indexOf('/Q.js')) >= 0) {
           _libdir = scripts[i].src.substring(0, pos);
           libscript = scripts[i];
        }
      }
    }

    // 解析script import
    var sImports = libscript.innerHTML;
    var re = /\n/ig;
    var arr = sImports.split(re);

    // 异步顺序加载
    async_load_js(document.getElementsByTagName("head")[0], arr);        
  };

  // 顺序加载js文件
  function async_load_js(header, ar) {
    ar = ar||[];
    if(ar.length<=0) { 
      _LoadCompleted = true;
      Q.DelayLoad();
      return;
    }
    
    // 加载lib
    var url = ar.shift();
    // 解析格式，并自动加载库文件
    var re2 = /^\s*import\s+(.+);/i;
    if(re2.test(url)) {
      url = RegExp.$1 + '';
      url = url.replace(/\./g, '/')+'.js';
      // 创建script结点,并将其属性设为外联JavaScript文件  
      var s = document.createElement("script");  
      s.type = "text/javascript";
      s.src = _libdir+'/'+url;

      // 对于IE浏览器，使用readystatechange事件判断是否载入成功  
      // 对于其他浏览器，使用onload事件判断载入是否成功  
      s.done = false;
      s.onload = s.onreadystatechange = (function() {
        if( !this.done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete"))
        {
          this.done = true;
          async_load_js(header, ar);
          // Handle memory leak in IE
          this.onload = this.onreadystatechange = null;
          header.removeChild( this );
        }
      });
      s.onerror = (function() { 
        // Handle memory leak in IE
        this.onload = this.onreadystatechange = null;
        header.removeChild(this); 
        async_load_js(header, ar);
      });
        
      // 获取head结点，并将<script>插入到其中  
      header.appendChild(s);
    } else {
      async_load_js(header, ar);
    }
  }

  // get Browser
  Q.agent   = function() { return navigator.userAgent.toLowerCase(); }
  Q.isW3C   = function() { return document.getElementById ? true:false; }
  Q.isIE    = function() { var a = Q.agent(); return ((a.indexOf("msie") != -1) && (a.indexOf("opera") == -1) && (a.indexOf("omniweb") == -1)); }
  Q.isOpera = function() { return Q.agent().indexOf("opera") != -1; }
  Q.isNS6   = function() { return Q.isW3C() && (navigator.appName=="Netscape"); }

  function Initialize() {
    // get Browser
    //为Firefox下的DOM对象增加innerText属性
    if(Q.isNS6()) { //firefox innerText define
      HTMLElement.prototype.__defineGetter__("innerText",    function() { return this.textContent; });
      HTMLElement.prototype.__defineSetter__("innerText",    function(sText) { this.textContent=sText; });
      HTMLElement.prototype.__defineGetter__("currentStyle", function () { return this.ownerDocument.defaultView.getComputedStyle(this, null); });
      // 兼容ff，ie的鼠标按键值
      Q.LBUTTON  = 0;
      Q.MBUTTON  = 1;
      
      // 解析地址页面的查询字段
      var querystring = location.search.toString();
      querystring = querystring.substring(1, querystring.length);
      var queryMap = querystring.split('&');
      for(var i=0; i < queryMap.length; i++) {
        var t = queryMap[i].split('=');
        if(t.length != 2) { continue; }
        _querystring[t[0]] = t[1];
      }
    }

    jsloader();
    Q.addEvent(window, 'load', Q.DOMReady);  
  }

  // initialize
  Initialize();
})();
/*************** import file stl.js***************/

/*--------------------------------------------------------------------------------
 $ basic  type list definition
----------------------------------------------------------------------------------*/
//列表节点结构
Q.NODE = Q.extend({
  next : null,
  prev : null,
  data  : null,
  construct : function(data) { this.data = data; }
});

Q.LIST = Q.extend({

head : null,  // 链表的头部
length : 0,
construct : function() {},
begin :    function() {  return this.head; },  // not head  use as STL
end :      function() {  return null;  },
len :      function() {  return this.length;  },
item :     function() {  return this.current.data; },

each : function(callback) {
  if(typeof callback == 'function') {
    for(var node = this.begin(); node != this.end(); node = node.next) {
      if(!callback(node.data)) break;
    }
  }
},

append : function(data){
  var node = new Q.NODE(data);
  if(!this.head) {
    this.head = node;
  } else {
    var tmp = this.head;
    while(tmp.next) { tmp = tmp.next; }
    tmp.next = node;
    node.prev = tmp;
  }

  this.length++;
},
  
erase : function(data){
  var node = this.find(data);
  if( node ) { 
    if(node != this.head) {
      if(node.prev)
        node.prev.next = node.next;
      if(node.next)
        node.next.prev = node.prev;
    } else {
      this.head = node.next;
      if(node.next) {
        node.next.prev = null;
      }
    }

    delete node;
    this.length--;
  }
},
  
clear : function(){
  for(var node = this.begin(); node != this.end(); node = node.next){
    this.removeNode(node);
  }
},
  
find : function(data){
  for(var node = this.begin(); node != this.end(); node = node.next){
    if( node.data == data )  return node;
  }
  return null;
},
  
toString : function(){
  var i = 0;
  var str = "";
  for(var node = this.begin(); node != this.end(); node = node.next){
    str += "Node["+i+"]: " + node.data + "\n";
    i++;
  }
  return str;
}

});


var STRUCT_HASMAP = Q.extend({
  base : null,
  length : 0,
  dataIndex : 0,
  construct : function() {
    this.base = new Object();
  },
  
  each : function(callback) {
    if(typeof callback != 'function') {
      return;
    }
    for(var key in this.base) {
      if(callback(this.base[key], key) == 0) { break; }
    }
  },
  
  item : function(key) {
    return this.base[key];
  },
  
  add    : function(key, value) {
    this.base[key] = value;
    this.length++;
  },
  
  remove : function(key) {
    //alert('is have')
    if(!this.has(key)) { return; }
    //alert('yes')
    delete this.base[key];
    this.length--;
  },
  
  clear : function() {
    var _this = this;
    _this.each(function(item, key){
      _this.remove(key);
    });
    this.length = 0;
  },
  
  push : function(value) {
    this.base[this.dataIndex] = value;
    this.length++;
    this.dataIndex++;
  },
  
  pop : function() {
    var re = this.base[this.dataIndex];
    delete this.base[this.dataIndex];
    this.length--;
    return re;
  },
  
  find : function(value) {
    var vkey = null;
    this.each(function(item, key){
      if(item == value) {
        vkey = key;
        return 0;
      }
    });
    return vkey;
  },
  
  has : function(key) {
    return !(typeof this.base[key] == 'undefined');
  }
});
/*************** import file xml.js***************/
/*-------------------------------------------------------
  function XMLDocument
  function: 创建XML文档实例
  date: 2008-06-12
  author: lovelylife
---------------------------------------------------------*/
// 解决ff下XML的selectNodes和selectSingleNode的实现问题
if (!window.ActiveXObject) {
	Element.prototype.selectNodes = function(sXPath) {
		var oEvaluator = new XPathEvaluator();
		var oResult = oEvaluator.evaluate(sXPath, this, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		var aNodes = new Array();

		if (oResult != null) {
			var oElement = oResult.iterateNext();
			while(oElement) {
				aNodes.push(oElement);
				oElement = oResult.iterateNext();
			}
		}
		return aNodes;
	};

	Element.prototype.selectSingleNode = function(sXPath) {
		var oEvaluator = new XPathEvaluator();
		// FIRST_ORDERED_NODE_TYPE returns the first match to the xpath.
		var oResult = oEvaluator.evaluate(sXPath, this, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		if (oResult != null) {
			return oResult.singleNodeValue;
		} else {
			return null;
		}              
	};
}


function XMLDocument(xmlfile) {
	var xmlDoc = null;
	
	try {
		if (window.ActiveXObject) {
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		} else if (document.implementation && document.implementation.createDocument){
			// code for Mozilla, Firefox, Opera, etc.
			xmlDoc=document.implementation.createDocument("","",null);
		} else {
			throw new Error('浏览器不支持.');
		}
		
		xmlDoc.async=false;
		
		if(xmlfile) {
			 if(!xmlDoc.load(xmlfile)) {
				//alert('加载xml文件出错!');
				throw new Error('加载xml文件出错!');
			}
		}
	} catch(e) {
		try {
			// for google chrome
			var xmlhttp = new window.XMLHttpRequest();
			if(xmlfile) {
				xmlhttp.open("GET", xmlfile, false);
				
				xmlhttp.send(null);
				//alert(xmlhttp.responseText);
				xmlDoc = xmlhttp.responseXML.documentElement.ownerDocument;	
			}
		} catch (e)	{
			alert(e);
			xmlDoc = null;
		}
	}

	return xmlDoc;
}

// 读取XML字符串并解析成DOM对象
Q.XML = function(xmlString){
	var doc;
	if (window.ActiveXObject) {
		doc = new ActiveXObject("MSXML2.DOMDocument");
		doc.loadXML(xmlString).documentElement;
	} else {
		doc = (new DOMParser()).parseFromString(xmlString, "text/xml").documentElement;
	}

	// IE下xmlDoc类型为Document, 其他浏览器为RootElement, 需要转换成Document类型
	return doc.ownerDocument?doc.ownerDocument:doc;
}

// 读取XML文件并解析成DOM对象
Q.XMLFile = function(xmlFile) {
	return XMLDocument(xmlFile);
}

function selectSingleNode(xmlDoc, elementPath)  {	
	if(window.ActiveXObject) {
		return xmlDoc.selectSingleNode(elementPath);
	} else {
		var xpe = new XPathEvaluator();
		var nsResolver = xpe.createNSResolver( xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
		var results = xpe.evaluate(elementPath,xmlDoc,nsResolver,XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		//alert(results);
        return results.singleNodeValue; 
	}
}


/* 
// IE only
//var ret = xmlDoc.loadXML("<?xml version=\"1.0\" encoding = \"GB2312\" ?><html>sdfasdfasdf</html>");
//var d = xmlDoc.load(fileName);
var xmlDoc = new XMLDocument();
var s = xmlDoc.loadXML('<t>dsadf</t>');
if( s ) { 
	var elements = xmlDoc.getElementsByTagName('t');	
	var element = elements[0];
	var newElement = xmlDoc.createElement('DIV');
	element.appendChild(newElement);
	newElement.text = 'newdivs'
	xmlDoc.save('C:\\im.xml')
}
*//*************** import file json2.js***************/
/*
    http://www.JSON.org/json2.js
    2008-11-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the object holding the key.

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true */

/*global JSON */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    JSON = {};
}
(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
})();
/*************** import file ajax.js***************/
/*
  file: ajax.js
*/

// 生成指定len长度的随机字符串
function Round(len) {
  var str = '';
  var roundArray = 'abcdef1234567890'.split('');
  for(var i=0; i < len; i++) {
    str += '' + roundArray[Math.round( Math.random()* (roundArray.length - 1))];
  }
  return str;
}

// 将object转成json字符串
function json2str(jsonObject) {
  return JSON.stringify(jsonObject, function(key, value){return value;});
}

Q.json_decode = function(message) {
  return JSON.parse(message);
}

Q.json_encode = function(v) {
  return JSON.stringify(v);
}

function STRUCT_REQUEST(json) {
  if(!json.command) { alert("Ajax error[no command]!"); }
  if(json.command.toString().indexOf('?') == -1) {
    this.command = json.command + '?' + '&rnd=' + Round(16);
  } else {
    this.command =   json.command ? (json.command + '&rnd=' + Round(16)) : null;
  }
  
  this.postdata = {
    header : json.header || null,
    data : json.data || null,
    extra : json.extra || null
  };
  this.disableWarning = !!json.disableWarning;
  this.oncomplete = json.oncomplete || function(){}; 
  this.onerror = json.onerror || function(){};

  this.toString = function() {
    return json2str(this.postdata);
  }
}

function _newAjaxTrans() {
  var transport = null;
  try  {
    transport = new ActiveXObject("Msxml2.XMLHTTP");
  } catch(e){
    try {
      transport = new ActiveXObject("Microsoft.XMLHTTP");
    } catch(sc) {
      transport = null;
    }
  }
  if( !transport && typeof XMLHttpRequest != "undefined" ) {
    transport = new XMLHttpRequest();
  }
    
  if(!transport) {
    alert('create ajax compoenet error!');
    return null;
  }
  return transport;
}


Q.Ajax = function(req) {
  request = new STRUCT_REQUEST(req);
  if( request.command == null ) {  
    alert('command is error: '+ request.comamnd); 
    return;  
  }
  var xmlhttp = _newAjaxTrans();
  if(!xmlhttp) return;
  var senddata = 'postdata='+encodeURIComponent(encodeURIComponent(request.toString())); 
  
  xmlhttp.open("POST", request.command, true);
  xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  if(req.withCredentials) {
    xmlhttp.withCredentials = !! req.withCredentials;
  }
  //xmlhttp.setRequestHeader( "Content-Type", "text/html;charset=UTF-8" );
  xmlhttp.onreadystatechange = function() {
    //try {
      // alert(xmlhttp.readyState+"=="+xmlhttp.status);
      // check the http status
      if(xmlhttp.readyState == 4) {
        if(xmlhttp.status == 200) {
          request.oncomplete &&request.oncomplete(xmlhttp);
        } else {
          request.onerror && request.onerror(xmlhttp);
        }
      } else {}
    //} catch (e) {
      //var errdesc = 'command url: '+request.command+'\n\n';
      //errdesc += 'script error: ' + e + '\n';
      //if(!request.disableWarning) { alert(errdesc); }
      //request.onerror && request.onerror(xmlhttp);
    //}
  };
  xmlhttp.send(senddata);
}
/*************** import file wndx-1-0-2.js***************/
/*--------------------------------------------------------------------------------
 $ 文档：wndx.js
 $ 功能：封装的窗口api和相关定义
 $ 日期：2007-10-09 15:47
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://jshtml.com] All rights reservered.
----------------------------------------------------------------------------------*/

// global const variables definition
var CONST = {
  SW_SHOW:           0x0001,
  SW_HIDE:           0x0000,

// window style
  STYLE_TITLE:     0x00000001,
  STYLE_MENU :     0x00000002,
  STYLE_TOOLBAR :  0x00000004,
  STYLE_STATUS:    0x00000008,
  STYLE_FIXED:     0x00000010,

// size status
  STYLE_MAX :      0x00000020,
  STYLE_MIN :      0x00000040,
  STYLE_CLOSE :    0x00000080,

  STYLE_ICON  :    0x00000100,
  STYLE_WITHBOTTOM :  0x00000200,
  
// size text
  SIZE_CLOSE:    'close',
  SIZE_MIN:      'min',
  SIZE_MAX:      'max',
  SIZE_NORMAL:   'normal',
  SIZE_RESIZE :  3,
  SIZE_DRAGING:  4,
  SIZE_RESIZING: 5,
  SIZE_MINING :  6,

// dialog define
  IDCANCEL :          '0'
};

CONST.STYLE_DEFAULT = CONST.STYLE_TITLE|CONST.STYLE_ICON|CONST.STYLE_MAX|CONST.STYLE_MIN|CONST.STYLE_CLOSE;

var __GLOBALS = {};
__GLOBALS.MIN_HEIGHT = 32;
__GLOBALS.MIN_WIDTH  = 100;
__GLOBALS.Z_INDEX    = 10000;
__GLOBALS.count      = 0;
__GLOBALS.appid      = -1;
__GLOBALS.apps       = {};

// global windows intitalize  
Q.Ready(function() {
  __GLOBALS.desktop = document.body;
  __GLOBALS.desktop.hook = new Q.LIST();
  __GLOBALS.desktop.wnds   = new Q.LIST();  // popups windows
  __GLOBALS.desktop.active_child = null;
  __GLOBALS.explorer = new Q.UIApplication();
  $CreateMaskLayer(__GLOBALS.desktop);
  (new __DRAGWND());

}, true);


/*-------------------------------------------------------------------------
 application base class
 manage the resources, i.e Q.Window
---------------------------------------------------------------------------*/
Q.Application = Q.extend({
id : -1,   // application id
construct : function(params) {
  // generator app id
  this.id = ++__GLOBALS.appid;
  __GLOBALS.apps[this.id] = this;
},

end : function() {
  delete __GLOBALS.apps[this.id];
},

});

Q.UIApplication = Q.Application.extend({
wnds_map: null,
construct : function(params) {
  this.__super__.construct.call(this, arguments);
  this.wnds_map = new Q.LIST();
},

add_window   : function(wndNode) { this.wnds_map.append(wndNode); },
erase_window : function(wndNode) { this.wnds_map.erase(wndNode); },
});

//  Q.Application end

/*-----------------------------------------------------------------
  common APIs
-------------------------------------------------------------------*/
// check the statement wether be null
function $IsNull(statement) { return  (statement == null); }
function $IsStyle(cs, style) { return ((cs & style) == style); }
function $IsWithStyle(style, wstyle) { return ((style & wstyle) == style); }


/*-----------------------------------------------------------------
  windows APIs
-------------------------------------------------------------------*/
function register_hook(h) {
  __GLOBALS.desktop.hook.append(h);
}

function unregister_hook(h) {
  __GLOBALS.desktop.hook.erase(h);
}

function invoke_hook(hwnd, message_id) {
  __GLOBALS.desktop.hook.each(function(f) {
    f(hwnd, message_id);
  });
}

function $IsDesktopWindow(wndNode) { return (__GLOBALS.desktop == wndNode); }
function $IsWindow(wndNode)        { return (!$IsNull(wndNode)) && (wndNode.nodeType == Q.ELEMENT_NODE) && wndNode.getAttribute('__QWindow__');}
function $IsMaxWindow(wndNode)     { return ($IsStyle($GetWindowStyle(wndNode), CONST.STYLE_MAX) && (CONST.SIZE_MAX == $GetWindowStatus(wndNode))); }
function $BindWindowMessage(wndNode, messageid, parameters) {
  return function() {
    wndNode.wnd_proc(wndNode, messageid, parameters);
  }
} 

function $MaskWindow(wndNode, bmask) { 
  var layer_mask = $GetMask(wndNode);
  if($IsDesktopWindow(wndNode)) {
    if(bmask) {
      layer_mask.body_style = document.body.currentStyle.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = layer_mask.body_style;
    }
  }
  $GetMask(wndNode).style.display=(!!bmask)?'':'none'; 
}
function $CreateMaskLayer(wndNode) {
  wndNode.layer_mask = document.createElement('DIV');
  wndNode.layer_mask.body_style = document.body.currentStyle.overflow;
  wndNode.layer_mask.className = 'clsMaskWindow alpha_1';
  wndNode.appendChild(wndNode.layer_mask);
  wndNode.layer_mask.style.display = 'none';
  wndNode.layer_mask.onmousedown = Q.bind_handler(wndNode, function(evt) { 
    evt = evt || window.event;
    $BindWindowMessage(this, MESSAGE.ACTIVATE)();
    // 取消事件冒泡，防止ActivateWindow被调用到
    evt.cancelBubble = true;
    return false; 
  });
  wndNode.layer_mask.onselectstart = function() { return false; }
}

function $ShowWindow(wndNode, ws)  {
  if( ws == CONST.SW_SHOW ){
    wndNode.style.display = '';
    $ActivateWindow(wndNode);
  } else if( ws == CONST.SW_HIDE ) {
    wndNode.style.display = 'none';
    $MaskWindow(wndNode, false);
  }
}

/*----------------------------------------------------
 窗口激活模式 $ActiveWindow

RootWindow (__GLOBALS.desktop)  
 |               
 +--active_child---> Window 1 
 |        +---------------- child window 1
 |        +---active_child---> child window 2
 |        +---------------- child window 3
 |
 +-------------- Window 2
 +-------------- Window 3
------------------------------------------------------*/
function $ActivateWindow(wndNode, zindex) {
  if(!$IsWindow(wndNode))
    return;
  Q.printf("active window " + $GetTitleText(wndNode));
  var defined_zindex = 0;
  if(!isNaN(zindex)) 
    defined_zindex = zindex;

  var parent_container = $GetContainerWindow(wndNode);
  $SetActiveChild(parent_container, wndNode);
    // set zindex
  var top_sibling = $GetTopZIndexWindow(parent_container);
  var z_active_sibling = $GetWindowZIndex(top_sibling)+1;
  $SetWindowZIndex(wndNode, (defined_zindex)?defined_zindex:z_active_sibling);
  $SetWindowActive(top_sibling, false);
  $SetWindowActive(wndNode, true);
}

function $SetWindowActive(wndNode, IsActive){
  var style;
  style = (IsActive) ? 'clsActiveTitle' : 'clsNoActiveTitle';
  
  var active_child = wndNode;
  while(active_child) {
    $GetTitle(active_child).className = style;
    active_child = $GetActiveChild(active_child);
  }
}

function $MaxizeWindow(wndNode){
  var ws = $GetWindowStyle(wndNode);
  if( $GetWindowStatus(wndNode) == CONST.SIZE_MAX ) { return; };
  var parent_container = $GetContainerWindow(wndNode);
  var width, height;
  if( parent_container == document.body ) {
    width = Math.max(document.body.clientWidth, document.body.scrollWidth);
    height = Math.max(document.body.clientHeight, document.body.scrollHeight);
  } else if( $IsWindow(parent_container) ) {
    width  = Math.max($GetClient(parent_container).clientWidth, $GetClient(parent_container).scrollWidth);
    height = Math.max($GetClient(parent_container).clientHeight, $GetClient(parent_container).scrollHeight);
  } else {  return;  }
  $ChangeCtrlButton(wndNode, CONST.SIZE_MAX, CONST.SIZE_NORMAL);
  $SetWindowPosition(wndNode, 0, 0, width, height);
  $SetWindowStatus(wndNode, CONST.SIZE_MAX);
}

function $RestoreWindow(wndNode){
  if( !$IsWindow(wndNode) ) {  return; }  
  $ChangeCtrlButton(wndNode, CONST.SIZE_MAX, CONST.SIZE_MAX);
  $MoveTo(wndNode, wndNode.rleft, wndNode.rtop);
  $ResizeTo(wndNode, wndNode.rwidth, wndNode.rheight);
  $SetWindowStatus(wndNode, CONST.SIZE_NORMAL);
}

function $MinimizeWindow(wndNode){
  if( $GetWindowStatus(wndNode) == CONST.SIZE_NIN )
    return;
  var ws = $GetWindowStyle(wndNode);
  if( $IsStyle(ws, CONST.STYLE_FIXED)) { return; }
  //wndNode.width = 0;
  //wndNode.style.width = 0;
  var width, height;
  var pos = Q.absPosition(wndNode);  
  $ResizeTo(wndNode, pos.right-pos.left, $GetTitle(wndNode).offsetHeight);
  $ChangeCtrlButton(wndNode, CONST.SIZE_MAX, CONST.SIZE_MAX);
  $SetWindowStatus(wndNode, CONST.SIZE_MIN);
}

function $FitWindow(wndNode) {
  var client = $GetClient(wndNode);
  var oldOverFlow = client.style.overflow;
  client.style.overflow = 'visible';
    
  var ws = $GetWindowStyle(wndNode);
  var lastHeight = client.scrollHeight;
  if( $IsStyle(ws, CONST.STYLE_TITLE)) {
    lastHeight = lastHeight + $GetTitle(wndNode).offsetHeight;
  }
    
  if( $IsStyle(ws, CONST.STYLE_WITHBOTTOM)) {
    lastHeight = lastHeight + ($GetBottomBar(wndNode).offsetHeight);
  }
    
  $ResizeTo(wndNode, client.scrollWidth, lastHeight);  // 自适应内容长度
  client.style.overflow = oldOverFlow;
}

/*-----------------------------------------------------------------
  windows APIs Set Methods
-------------------------------------------------------------------*/

function $SetWindowPosition(wndNode, left, top, width, height) {
    $SaveRectForWindow(wndNode);
    $MoveTo(wndNode, left, top);
    $ResizeTo(wndNode, width, height);
}

function $SetWindowTitle(wndNode, title){
  wndNode.title_text = title;
  wndNode.hTitle.hTitleContent.innerText = title;
}

function $SaveRectForWindow(wndNode) {
    if( $GetWindowStatus(wndNode) == CONST.SIZE_NORMAL ) {
      wndNode.rtop    = parseInt(wndNode.style.top, 10);
      wndNode.rleft   = parseInt(wndNode.style.left, 10);
      wndNode.rwidth  = wndNode.offsetWidth;
      wndNode.rheight = wndNode.offsetHeight;
    }
}

function $SetActiveChild(wndNode, child)   { wndNode.active_child = child;  }
function $SetWindowStatus(wndNode, status) { wndNode.status_type  = status; }
function $SetWindowZIndex(wndNode, zIndex) { if( isNaN(parseInt(zIndex)) ) { return; } wndNode.style.zIndex = zIndex; }

/*-----------------------------------------------------------------
  windows APIs Get Methods
-------------------------------------------------------------------*/

function $GetDesktopContainer()    { return __GLOBALS.desktop;   }
function $GetDesktopWindow()       { return __GLOBALS.desktop;   }
function $GetMask(wndNode)         { return wndNode.layer_mask;  }
function $GetActiveChild(wndNode)  { return wndNode.active_child;}
function $GetContainerWindow(wndNode) { return wndNode.container_wnd;  }
function $GetParentWindow(wndNode) { return wndNode.parent_wnd;  }
function $GetWnds(wndNode)         { return wndNode.wnds;        }
function $GetMinCtrlButton(wndNode){ return wndNode.hTitle.hMin; }
function $GetMaxCtrlButton(wndNode){ return wndNode.hTitle.hMax; }
function $GetTitleText(wndNode)    { return wndNode.title_text;  }
function $GetTitleContent(wndNode) { return wndNode.hTitleContent; }
function $GetTitle(wndNode)        { return wndNode.hTitle;      }
function $GetBottomBar(wndNode)    { return wndNode.hBottomBar;  }
function $GetWindowStatus(wndNode) { return wndNode.status_type; }
function $GetWindowStyle(wndNode)  { return wndNode.wstyle;      }
function $GetClient(wndNode)       { return wndNode.hClientArea; }

function $GetWindowZIndex(wndNode){
  if(wndNode && wndNode.style && wndNode.style.zIndex) {
    return parseInt(wndNode.style.zIndex, 10);
  } else {
    return __GLOBALS.Z_INDEX;
  }
}

function $GetTopZIndexWindow(){
  var parent_wnd;
  if( arguments.length > 0 && $IsWindow(arguments[0]) ) {
    parent_wnd = arguments[0];
  } else {
    parent_wnd = $GetDesktopWindow();
  }
  var wnds = $GetWnds(parent_wnd);
  var top_wnd = null; 
 
  wnds.each(function(wnd) {
   if(top_wnd) {
     top_zindex = $GetWindowZIndex(top_wnd);
     wnd_zindex = $GetWindowZIndex(wnd);
     if( wnd_zindex > top_zindex ) {
       top_wnd = wnd;
     }
   } else {
     top_wnd = wnd;
   }
   return true; 
  }); 
  
  return top_wnd;
}

function $MoveTo(wndNode, x, y){
  wndNode.nTop = y;
  wndNode.nLeft = x;
  wndNode.style.top = wndNode.nTop + 'px';
  wndNode.style.left = wndNode.nLeft + 'px';
}

function $ResizeTo(wndNode, width, height){
  if(typeof(wndNode.onresize) == 'function') {
    wndNode.onresize();
  }
   
  width = parseInt(width,10);
  height = parseInt(height, 10);
  
  wndNode.nWidth = width;
  wndNode.nHeight = height;
  wndNode.style.width = width + 'px';
  wndNode.style.height = height + 'px';

  //var client = $GetClient(wndNode);  // 重画客户区
  //var ws = $GetWindowStyle(wndNode);
  //var lastHeight = height;
  
  //if( $IsStyle(ws, CONST.STYLE_TITLE)) {
  //  lastHeight = lastHeight - $GetTitle(wndNode).offsetHeight;
  //}

  //if( $IsStyle(ws, CONST.STYLE_WITHBOTTOM)) {
  //  lastHeight = lastHeight - ($GetBottomBar(wndNode).offsetHeight);
  //}
  //client.style.height = Math.max(lastHeight - 0, __GLOBALS.MIN_HEIGHT)+'px';
  //client.style.width = Math.max(width - 0, __GLOBALS.MIN_WIDTH) + 'px';
}

function $GetWindowClientHeight() {
  var myHeight = 0;
  if (typeof(window.innerHeight) == 'number') {
    //Non-IE
    myHeight = window.innerHeight;
  } else if (document.documentElement && document.documentElement.clientHeight) {
    //IE 6+ in 'standards compliant mode'
    myHeight = document.documentElement.clientHeight;
  } else if (document.body && document.body.clientHeight) {
    //IE 4 compatible
    myHeight = document.body.clientHeight;
  }
  return myHeight;
}

function $CenterWindow(wndNode) {
  var left = (document.body.clientWidth - wndNode.nWidth ) / 2;
//  var top =  (document.body.clientHeight - wndNode.nHeight ) / 2;
  var si = Q.scrollInfo();
  var top =  si.t + (($GetWindowClientHeight() - wndNode.nHeight ) / 2);
  $MoveTo(wndNode, left, top);
}

function $AddDragObject(wndNode, obj) { wndNode.drag_objects.append(obj); }
function $RemoveDragObjects(wndNode, obj) { wndNode.drag_objects.erase(obj); }
function $IsDragObject(wndNode, obj) { if(!$IsWindow(wndNode)) return false;  return wndNode.drag_objects.find(obj); }

function $SetWindowStyle(wndNode, ws){ 
  wndNode.wstyle = ws;
  if($IsStyle(ws, CONST.STYLE_FIXED)) {
    
  }
 
  /* 
  if($IsStyle(ws, CONST.STYLE_TITLE)) {
    wndNode.hTitle.style.display='';
  } else {
    wndNode.hTitle.style.display='none';
  }
  */
  if($IsStyle(ws, CONST.STYLE_MAX)) {  
    $GetMaxCtrlButton(wndNode).style.display='';
  } else {
    $GetMaxCtrlButton(wndNode).style.display='none';
  }
  
  if($IsStyle(ws, CONST.STYLE_MIN)) {
    $GetMinCtrlButton(wndNode).style.display='';
  } else {
    $GetMinCtrlButton(wndNode).style.display='none';
  }
  
  if( $IsStyle(ws, CONST.STYLE_WITHBOTTOM) ) {
    $GetClient(wndNode).className = "clsClientArea clsWithBottom"
    wndNode.hBottomBar.style.display = '';
  } else {
    $GetClient(wndNode).className = "clsClientArea"
    wndNode.hBottomBar.style.display = 'none';
  }
    
  if($IsStyle(ws, CONST.STYLE_CLOSE)) {
    //wndNode.hTitle.style.display=''; 
  } else {
    //wndNode.hTitle.style.display=''; 
  }

  return wndNode.wstyle; 
}

var MESSAGE = {
  CREATE: 0,
  MIN   : 1,
  MAX   : 2,
  CLOSE : 3,
  ACTIVATE : 4,
}

function $DefaultWindowProc(hwnd, msg, data) {
  switch(msg) {
  case MESSAGE.CREATE:
    Q.printf('DefaultWindowProc MESSAGE.CREATE');
    break;  
  case MESSAGE.MIN:
    Q.printf('DefaultWindowProc MESSAGE.MIN');
    $MinimizeWindow(hwnd);
    break;
  case MESSAGE.MAX:
    Q.printf('DefaultWindowProc MESSAGE.MAX');
    if(!$IsStyle($GetWindowStyle(hwnd), CONST.STYLE_MAX))
      return;
    if(hwnd.status_type != CONST.SIZE_MAX) { 
      $MaxizeWindow(hwnd); 
    } else { 
      $RestoreWindow(hwnd); 
    }
    break;
  case MESSAGE.CLOSE:
    Q.printf('DefaultWindowProc MESSAGE.CLOSE');
    $DestroyWindow(hwnd);
    break;  
  
  case MESSAGE.ACTIVATE:
    {
      Q.printf('DefaultWindowProc MESSAGE.ACTIVATE -> ' + $GetTitleText(hwnd));
      var top_wnd = $GetTopZIndexWindow($GetDesktopWindow());
      var top_zindex = $GetWindowZIndex(top_wnd);
      var t = hwnd;

      // 最底部的模式窗口
      while(t && t.modal_prev) 
        t = t.modal_prev;
      // 统计增加的层数
      while(t && t.modal_next) { 
        t = t.modal_next;
        ++top_zindex;  
      }
      // 先激活顶层窗口
      $ActivateWindow(t, ++top_zindex);
      // 一层层设置zindex
      while(t && t.modal_prev) {
        t = t.modal_prev;
        $SetWindowZIndex(t, --top_zindex); 
      }
    }
    break;  
  }
  invoke_hook(hwnd, msg);
}

function $SetWindowProc(wndNode, new_window_proc) {
  if(typeof new_window_proc == 'function') {
    var old_wnd_proc = wndNode.wnd_proc;
    wndNode.wnd_proc = new_window_proc;
    return old_wnd_proc;
  }

  return null;
}

function $CreateCtrlButton(type) {
  var btn = document.createElement('button');  
  btn.innerHTML = '&nbsp;';
  btn.className = type;
  btn.hideFocus = true;
  return btn;
}

function $ChangeCtrlButton(wndNode, type, dsttype){
  var btn;
  if( type == CONST.SIZE_MIN )
    btn = $GetMinCtrlButton(wndNode);
  else if( type == CONST.SIZE_MAX )
    btn = $GetMaxCtrlButton(wndNode);
  btn.className = dsttype;
}

function $CreateWindowTitlebar(hwnd)  {
  var hTitle = document.createElement('DIV');
  hTitle.className = 'clsActiveTitle';
  hTitle.onselectstart = function() { return false; };
  hTitle.ondblclick    = function() { Q.printf('WINDOW title dblclick'); $BindWindowMessage(hwnd, MESSAGE.MAX)(); }

  hTitle.hIcon = document.createElement('IMG');
  hTitle.hIcon.className = 'clsIcon';
  hTitle.appendChild(hTitle.hIcon);
   
  hTitle.hTitleContent = document.createElement('DIV');
  hTitle.hTitleContent.className = 'clsTitleContent';
  hTitle.appendChild(hTitle.hTitleContent);
  
  hTitle.hTitleCtrlBar = document.createElement('DIV');
  hTitle.hTitleCtrlBar.className = 'clsTitleCtrlBar';
  hTitle.appendChild(hTitle.hTitleCtrlBar);
  
  hTitle.hMin = $CreateCtrlButton('min');
  hTitle.hMax = $CreateCtrlButton('max');
  hTitle.hClose = $CreateCtrlButton('close');

  hTitle.hMin.onclick = $BindWindowMessage(hwnd, MESSAGE.MIN);
  hTitle.hMax.onclick = $BindWindowMessage(hwnd, MESSAGE.MAX);
  hTitle.hClose.onclick = $BindWindowMessage(hwnd, MESSAGE.CLOSE);
  
  hTitle.hTitleCtrlBar.appendChild(hTitle.hMin);
  hTitle.hTitleCtrlBar.appendChild(hTitle.hMax);
  hTitle.hTitleCtrlBar.appendChild(hTitle.hClose);

  hwnd.hTitle = hTitle;
  hwnd.appendChild(hTitle);
  $AddDragObject(hwnd, hwnd.hTitle);
  $AddDragObject(hwnd, hwnd.hTitle.hTitleCtrlBar);
  $AddDragObject(hwnd, hwnd.hTitle.hTitleContent);
}


function $CreateWindow(parent_wnd, title, ws, pos_left, pos_top, width, height, app){
  var wstyle = ws || CONST.STYLE_DEFAULT;
  var container      = null;
  var container_wnd  = null;
  if( !$IsWindow(parent_wnd) ) 
    parent_wnd = $GetDesktopWindow();
 
  container = $GetDesktopWindow();
  container_wnd = $GetDesktopWindow();
  
  // 创建窗口
  var hwnd = document.createElement('DIV');
  // user data
  hwnd.setAttribute('__QWindow__', true);  // 设置QWindow标记，用于$IsWindow方法
  hwnd.wstyle       = ws || CONST.STYLE_DEFAULT;  // 窗口样式
  hwnd.parent_wnd   = parent_wnd;
  hwnd.container_wnd = container_wnd;
  hwnd.modal_next   = null;
  hwnd.model_prev   = null;  
  hwnd.wnds         = new Q.LIST();   // 窗口
  hwnd.drag_objects = new Q.LIST();
  hwnd.active_child = null; 
  hwnd.title_text   = title || 'untitled';
  hwnd.status_type  = CONST.SIZE_NORMAL;
  hwnd.wnd_proc     = $DefaultWindowProc;
  hwnd.app = app || __GLOBALS.explorer;
  hwnd.app.add_window(hwnd); 

  // dom attributes
  hwnd.className = 'clsWindows';
  hwnd.style.display = 'none';
  hwnd.style.zIndex = __GLOBALS.Z_INDEX;

  if(isNaN(pos_top)) 
    pos_top = 0;
  if(isNaN(pos_left)) 
    pos_left = 0;
  if(isNaN(width)) 
    width = 300;
  if(isNaN(height)) 
    height = 300;

  hwnd.nTop    = hwnd.rtop = pos_top;
  hwnd.nLeft   = hwnd.rleft = pos_left;
  hwnd.nWidth  = hwnd.rwidth = width;
  hwnd.nHeight = hwnd.rheight = height;
  
  hwnd.style.top    = pos_top + 'px'; 
  hwnd.style.left   = pos_left + 'px';
  hwnd.style.width  = width + 'px'; 
  hwnd.style.height = height + 'px';
  
  // register to wnds
  $GetWnds(container_wnd).append(hwnd);
 
  // 主窗口
  //if( !$IsStyle(ws, CONST.STYLE_FIXED) ) {
    $MakeResizable(hwnd);
  //}
  
  $SaveRectForWindow(hwnd);
  Q.addEvent(hwnd, 'mousedown', $BindWindowMessage(hwnd, MESSAGE.ACTIVATE));

  // initial title bar
  $CreateWindowTitlebar(hwnd);
  $SetWindowTitle(hwnd, hwnd.title_text);

  hwnd.hClientArea = document.createElement('DIV');
  hwnd.hClientArea.className = 'clsClientArea';
  hwnd.appendChild(hwnd.hClientArea);
  
  // bottom bar
  hwnd.hBottomBar = document.createElement('DIV');
  hwnd.hBottomBar.className = 'clsBottomBar';
  hwnd.appendChild(hwnd.hBottomBar);

  // mask window
  $CreateMaskLayer(hwnd);
  
  $SetWindowStyle(hwnd, ws);
  $BindWindowMessage(hwnd, MESSAGE.CREATE)();
  
  // render 
  container.appendChild(hwnd);

  return hwnd;
}

function $DestroyWindow(wndNode) {
  // 清除子窗口
  var child_wnds = $GetWnds(wndNode);
  child_wnds.each(function(wnd) {
    $BindWindowMessage(wnd, MESSAGE.CLOSE)();
    return true;
  });

  // 清除弹出的子窗口
  var parent_container = $GetContainerWindow(wndNode);
  var parent_wnds = $GetWnds(parent_container);
  parent_wnds.each(function(wnd) { 
    if($GetParentWindow(wnd) == wndNode) 
      $BindWindowMessage(wnd, MESSAGE.CLOSE)();
    return true;
  });

  // 从父容器中清除自己
  parent_wnds.erase(wndNode); 
  // 删除渲染节点delete dom   
  wndNode.setAttribute('__QWindow', null);
  wndNode.parentNode.removeChild(wndNode);
  wndNode = 0;

  // 激活相邻窗口 
  var wnd = $GetTopZIndexWindow(parent_container);
  if($IsNull(wnd)) {
    $SetActiveChild(parent_container, null);
  } else if( $IsWindow(wnd) ) {
    $BindWindowMessage(wnd, MESSAGE.ACTIVATE)();
  } else {
    $BindWindowMessage(parent_container, MESSAGE.ACTIVATE)();
  }
}

function $MakeResizable(obj) {
  var d=11;
  var l,t,r,b,ex,ey,cur;
  // 这里存在内存泄露，不需要的时候Q.removeEvent
  // 由于FireFox的CaptureEvents不支持CaptureEvents指定的Element对象
  Q.addEvent(document, 'mousedown', mousedown);
  Q.addEvent(document, 'mouseup',   mouseup);
  Q.addEvent(document, 'mousemove', mousemove);

  function mousedown(evt){
    evt = evt || window.event;
    var status = $GetWindowStatus(obj);
    //Q.printf('mousedown out' + status);
    if( (status != CONST.SIZE_MAX) && (evt.button == Q.LBUTTON) && obj.style.cursor)
    {
      //Q.printf('mousedown in' + status);
      $SetWindowStatus(obj, CONST.SIZE_RESIZING);
      if(obj.setCapture)
        obj.setCapture();
      else if(window.captureEvents)
        window.captureEvents(Event.MOUSEMOVE|Event.MOUSEUP);
    }
  }

  function mouseup(evt){
    evt = evt || window.event;
    var status = $GetWindowStatus(obj);
    if( ( status != CONST.SIZE_MAX ) && ( status == CONST.SIZE_RESIZING ) && ( evt.button == Q.LBUTTON ) )
    {
      //Q.printf('mouseup in '+status);
      obj.draging = false;
      $SetWindowStatus(obj, CONST.SIZE_NORMAL);
      if(obj.releaseCapture)
        obj.releaseCapture();
      else if(window.releaseEvents)
        window.releaseEvents(Event.MOUSEMOVE|Event.MOUSEUP);
    }
  }

  function mousemove(evt) {
    evt = evt || window.event;
    var srcElement = evt.srcElement || evt.target;
    var status = $GetWindowStatus(obj);
    if(( status & CONST.SIZE_MAX ) || ( $IsStyle($GetWindowStyle(obj), CONST.STYLE_FIXED) ) || (status == CONST.SIZE_MIN))
    {
      //Q.printf('wrong status');
      return;  
    }
    if( status == CONST.SIZE_RESIZING ) {
      //Q.printf('move sizing.');  
      var dx=evt.screenX-ex;
      var dy=evt.screenY-ey;

      if(cur.indexOf('w')>-1) l+=dx;
      else if(cur.indexOf('e')>-1) r+=dx;
      if(cur.indexOf('n')>-1) t+=dy;
      else if(cur.indexOf('s')>-1) b+=dy;

      var s = obj.style;
      if(r-l > __GLOBALS.MIN_WIDTH){
        s.left=l+'px';
        s.width = (r-l) +'px';
      }

      if(b-t > __GLOBALS.MIN_HEIGHT){
        s.top= t+'px';
        s.height= (b-t)+'px';
      }

      $ResizeTo(obj, s.offsetWidth, s.offsetHeight);
      ex+=dx;
      ey+=dy;
    } else if( srcElement == obj ) {
      //Q.printf('caculate cursor style');  
      var x = evt.offsetX==undefined?evt.layerX:evt.offsetX;
      var y = evt.offsetY==undefined?evt.layerY:evt.offsetY;
      var c=obj.currentStyle;
      w=parseInt(c.width,  10);
      h=parseInt(c.height, 10);
      var current_style_left = parseInt(c.left, 10);
      var current_style_top  = parseInt(c.top, 10);

      //Q.printf('x='+x+';y='+y+';w='+w+';h='+h);
      // 计算鼠标样式
      cur=y<d?'n':h-y<d?'s':'';
      cur+=x<d?'w':w-x<d?'e':'';
      if(cur){
        obj.style.cursor=cur+'-resize';
        l=current_style_left;
        t=current_style_top;
        r=l+w;
        b=t+h;
        ex=evt.screenX;
        ey=evt.screenY;
      } else if(obj.style.cursor) {
        obj.style.cursor='';
      }
    } else {
      obj.style.cursor = '';
    }
  }
}

/*-----------------------------------------------------------------
 $ window dragging
 $ dialog base class
 $ date: 2007-11-20
-------------------------------------------------------------------*/
var __DRAGWND = Q.extend({
  nn6 : Q.isNS6(),
  ie  : Q.isIE(),
  hCaptureWnd : null,
  hDragWnd : null,
  isdrag : false,
  x : 0,
  y : 0,
  beginX : 0,
  beginY : 0,
  endX : 0,
  endY : 0,
  MouseDown_Hanlder : null,
  MouseUp_Handler : null,
  MouseMove_Handler : null,
  isMoved : false,
  tmr : null,
  construct : function(){
    var _this = this;

    // 缓存时间
    _this.MouseDown_Hanlder = function(evt) { _this._MouseDown(evt); }
    _this.MouseUp_Handler = function(evt) { _this._MouseUp(evt); }
    _this.MouseMove_Handler = function(evt) { _this._MouseMove(evt); }

    Q.addEvent(document, 'mousedown', _this.MouseDown_Hanlder);
    Q.addEvent(document, 'mouseup', _this.MouseUp_Handler);
    
    _this.hDragWnd = document.createElement('div');
    document.body.appendChild(_this.hDragWnd);
    _this.hDragWnd.style.cssText = 'position:absolute;display:none;z-index: 1000000; background:#474747;cursor:default;';
    _this.hDragWnd.className = 'alpha_5';
  },

  _MouseDown : function(evt) {
    var _this = this;
    evt = evt || window.event;
    if(evt.button == Q.RBUTTON){ return; } // 屏蔽右键拖动
    var target_wnd = oDragHandle = _this.nn6 ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄
    
    while(target_wnd && (target_wnd.className.indexOf('clsWindow') == -1 ) && target_wnd != $GetDesktopWindow()) {
      target_wnd = target_wnd.parentNode;
    }

    if(target_wnd && (!$IsMaxWindow(target_wnd)) && $IsDragObject(target_wnd, oDragHandle)) {
      var pos = Q.absPosition(target_wnd);
      _this.isdrag = true; 
      _this.hCaptureWnd = target_wnd; 
      _this.beginY = pos.top; //parseInt(_this.hCaptureWnd.style.top+0); 
      _this.y = _this.nn6 ? evt.clientY : evt.clientY; 
      _this.beginX = pos.left; //parseInt(_this.hCaptureWnd.style.left+0); 
      _this.x = _this.nn6 ? evt.clientX : evt.clientX;
        
      _this.hDragWnd.style.display = 'none';
      _this.hDragWnd.style.width = _this.hCaptureWnd.offsetWidth + 'px';
      _this.hDragWnd.style.height = _this.hCaptureWnd.offsetHeight + 'px';
      _this.hDragWnd.style.top = pos.top + 'px'; //_this.hCaptureWnd.style.top;
      _this.hDragWnd.style.left = pos.left + 'px'; //_this.hCaptureWnd.style.left;
        
      // 添加MouseMove事件
      _this.tmr = setTimeout(function() { Q.addEvent(document, 'mousemove', _this.MouseMove_Handler) }, 100);
      return false; 
    }
  },
    
  _MouseMove : function(evt){
    var _this = this;
    _this.isMoved = true;
    evt = evt || window.event
    if (_this.isdrag && !$IsMaxWindow(_this.hCaptureWnd)) {
      _this.hDragWnd.style.display = '';
      var x = (_this.nn6?(_this.beginX+evt.clientX-_this.x):(_this.beginX+evt.clientX-_this.x));
      var y = (_this.nn6?(_this.beginY+evt.clientY-_this.y):(_this.beginY+evt.clientY-_this.y));
      if(x < 0) {  x = 0; }

      if(x+_this.hDragWnd.offsetWidth >  document.body.scrollWidth) {
        x = document.body.scrollWidth - _this.hDragWnd.offsetWidth;
      }

      if(y <0) {y = 0;}
      
      if(y+_this.hDragWnd.offsetHeight >  document.body.scrollHeight) {
        y = document.body.scrollHeight - _this.hDragWnd.offsetHeight;
      }
      
      // 移动拖动窗口位置
      _this.hDragWnd.style.left = x+'px';
      _this.hDragWnd.style.top = y+'px';
      
      // 保存坐标
      _this.endX = x;
      _this.endY = y;

      return false; 
    }
  },

  _MouseUp : function(evt) {
    var _this = this;
    clearTimeout(_this.tmr);
    if(_this.isdrag ) {
      var pos = Q.absPosition(_this.hCaptureWnd.parentNode);
      Q.removeEvent(document,'mousemove',_this.MouseMove_Handler);
      _this.isdrag=false;
      _this.hDragWnd.style.display = 'none';
       
      _this.isMoved && $MoveTo(_this.hCaptureWnd, _this.endX-pos.left, _this.endY-pos.top);
      //$ShowWindow(_this.hCaptureWnd, CONST.SW_SHOW);
    }
    _this.isMoved=false;
  }
});

/*-----------------------------------------------------------------
 $ class Q.Window
 $ dialog base class
 $ date: 2014-05-16
-------------------------------------------------------------------*/
// 创建窗口，并返回一个窗口操作类
Q.Window = Q.extend({
hwnd : null,
construct : function(config) {
  config = config || {};
  var _this = this;
  var title = config.title || '无标题';
  var left  = config.left || 0;
  var top   = config.top || 0;
  var width = config.width || 600;
  var height= config.height || 400;
  var parent_wnd= $GetDesktopWindow();
  if(config.parent instanceof Q.Window) 
    parent_wnd = config.parent.wnd() || $GetDesktopWindow();

  config.wstyle = config.wstyle || CONST.STYLE_DEFAULT;
  this.hwnd = $CreateWindow(parent_wnd, title, config.wstyle, left, top, width, height);  
  this.set_content(config.content);
},

wnd : function() { return this.hwnd; },
set_window_proc : function(new_window_proc) { return $SetWindowProc(this.hwnd, new_window_proc); },
set_zindex : function(zIndex) { $SetWindowZIndex(this.hwnd, zIndex); },

set_content : function(HTMLContent) {
  HTMLContent = HTMLContent || "";
  if(HTMLContent && HTMLContent.nodeType == Q.ELEMENT_NODE) {
    $GetClient(this.hwnd).appendChild(HTMLContent);
    HTMLContent.style.display = '';
  } else {
    $GetClient(this.hwnd).innerHTML = HTMLContent;
  }
},
show : function(isVisible) { $ShowWindow(this.hwnd, (!!isVisible)?CONST.SW_SHOW:CONST.SW_HIDE); },
center : function()        { $CenterWindow(this.hwnd); },
adjust : function()        { $FitWindow(this.hwnd); },
});

/*-----------------------------------------------------------------
 $ class Q.Dialog
 $ dialog base class
 $ date: 2007-11-20
-------------------------------------------------------------------*/
Q.Dialog = Q.Window.extend({
old_window_proc : null,
construct : function(config) {
  config = config || {};
  config.wstyle = config.wstyle || CONST.STYLE_DEFAULT;
  config.wstyle |= CONST.STYLE_FIXED;
  config.wstyle |= CONST.STYLE_CLOSE;
  config.wstyle |= CONST.STYLE_WITHBOTTOM;
  config.wstyle &= ~CONST.STYLE_MAX;
  config.wstyle &= ~CONST.STYLE_MIN;
  config.wstyle &= ~CONST.STYLE_ICON;

  this.__super__.construct.call(this, config);
  this.old_window_proc = this.set_window_proc( (function(qwindow) {
    return function(hwnd, msgid, json) { return qwindow.window_proc(msgid, json);}
  })(this)); 
},

// dialog procedure
window_proc : function(msgid, json) {
  switch(msgid) {
  case MESSAGE.CLOSE:
    $MaskWindow(this.hwnd.modal_prev, false);
    this.hwnd.modal_prev.modal_next = null;
    this.hwnd.modal_prev = null;
    break;
  }

  return this.old_window_proc(this.hwnd, msgid, json);
},

add_bottom_button : function(text, className, lpfunc) {
  var _this = this;
  var ws = $GetWindowStyle(this.hwnd);
  
  if((!$IsStyle(ws, CONST.STYLE_WITHBOTTOM)) || $IsNull($GetBottomBar(this.hwnd))) {
    return false;
  }
  var btn = document.createElement('button');
  $GetBottomBar(this.hwnd).appendChild(btn);
  btn.innerText = text;
  btn.onclick = lpfunc;
  btn.className = className;
  return true;
},

domodal : function(wndNode) {
  Q.printf('domodal window');
  if($IsNull(wndNode)) {
    wndNode = $GetActiveChild($GetDesktopWindow());
    if($IsNull(wndNode)) {
      wndNode = $GetDesktopWindow();
    }
  }
  $MaskWindow(wndNode, true);
  wndNode.modal_next = this.hwnd;
  this.hwnd.modal_prev = wndNode;
  
  this.show(true);
  $ResizeTo(this.hwnd, this.hwnd.nWidth, this.hwnd.nHeight);
  this.center();
},
 
end_dialog : function(code) {
  $BindWindowMessage(this.hwnd, MESSAGE.CLOSE)();
  if( arguments.length > 1 )  
    return arguments[1];
  else 
    return CONST.IDCANCEL;
},

});

/*-----------------------------------------------------------------
  class Q.MessageBox
-------------------------------------------------------------------*/
var MSGBOX_LEFT    = 0x0001;
var MSGBOX_CENTER  = 0x0002;
var MSGBOX_RIGHT   = 0x0004;
var MSGBOX_YES     = 0x0008;  // 是
var MSGBOX_NO      = 0x0010;    // 否
var MSGBOX_CANCEL  = 0x0020;  // 取消
var MSGBOX_YESNO   = MSGBOX_YES | MSGBOX_NO;  // 是/否
var MSGBOX_YESNOCANCEL  = MSGBOX_YES | MSGBOX_NO | MSGBOX_CANCEL;  // 是/否/取消

Q.MessageBox = function(config) {
  config = config || {};
  config.width  = config.width  || 360;
  config.height = config.height || 200;
  var dlg = new Q.Dialog(config);
  dlg.set_content(config.content);
  dlg.onok = config.onok || function() {};
  dlg.onno = config.onno || function() {};
  dlg.oncancel = config.oncancel || function() {};
  config.bstyle = config.bstyle || MSGBOX_YES;
  if( $IsWithStyle(MSGBOX_YES, config.bstyle) ) {
    dlg.add_bottom_button('  是  ', 'sysbtn', Q.bind_handler(dlg, function() {
        var return_ok = true;
        if(this.onok)  { 
          return_ok = this.onok(); 
        }
        if(return_ok) {
          this.end_dialog();
        }          
      }))
  }
    
  if( $IsWithStyle(MSGBOX_NO, config.bstyle) ) {
    dlg.add_bottom_button('  否  ', 'sysbtn', Q.bind_handler(dlg, function(){
        if(this.onno){ this.onno(); }
        this.end_dialog();
      }))
  }

  if( $IsWithStyle(MSGBOX_CANCEL, config.bstyle) ) {
    dlg.add_bottom_button(' 取消 ', 'syscancelbtn', Q.bind_handler(dlg,  function(){
        if(this.oncancel){ this.oncancel(); }
        this.end_dialog();
      }))
  }

  dlg.domodal();
  dlg.adjust();
  dlg.center();
}

/*************** import file tween.js***************/
/*-------------------------------------------------------
  function Tween
  date: 2013-01-30
  author: lovelylife
  tween 算法来源：http://www.robertpenner.com/easing/
---------------------------------------------------------*/

var Tween = {
	Linear: function(t,b,c,d){ return c*t/d + b; },
	Quad: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t + b;
		},
		easeOut: function(t,b,c,d){
			return -c *(t/=d)*(t-2) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 * ((--t)*(t-2) - 1) + b;
		}
	},
	Cubic: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return c*((t=t/d-1)*t*t + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		}
	},
	Quart: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return -c * ((t=t/d-1)*t*t*t - 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
			return -c/2 * ((t-=2)*t*t*t - 2) + b;
		}
	},
	Quint: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return c*((t=t/d-1)*t*t*t*t + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
			return c/2*((t-=2)*t*t*t*t + 2) + b;
		}
	},
	Sine: {
		easeIn: function(t,b,c,d){
			return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
		},
		easeOut: function(t,b,c,d){
			return c * Math.sin(t/d * (Math.PI/2)) + b;
		},
		easeInOut: function(t,b,c,d){
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		}
	},
	Expo: {
		easeIn: function(t,b,c,d){
			return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
		},
		easeOut: function(t,b,c,d){
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if (t==0) return b;
			if (t==d) return b+c;
			if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
			return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
		}
	},
	Circ: {
		easeIn: function(t,b,c,d){
			return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
		},
		easeOut: function(t,b,c,d){
			return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
		}
	},
	Elastic: {
		easeIn: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		},
		easeOut: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
		},
		easeInOut: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
			return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
		}
	},
	Back: {
		easeIn: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158;
			return c*(t/=d)*t*((s+1)*t - s) + b;
		},
		easeOut: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158;
			return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		},
		easeInOut: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158; 
			if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
			return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
		}
	},
	Bounce: {
		easeIn: function(t,b,c,d){
			return c - Tween.Bounce.easeOut(d-t, 0, c, d) + b;
		},
		easeOut: function(t,b,c,d){
			if ((t/=d) < (1/2.75)) {
				return c*(7.5625*t*t) + b;
			} else if (t < (2/2.75)) {
				return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
			} else if (t < (2.5/2.75)) {
				return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
			} else {
				return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
			}
		},
		easeInOut: function(t,b,c,d){
			if (t < d/2) return Tween.Bounce.easeIn(t*2, 0, c, d) * .5 + b;
			else return Tween.Bounce.easeOut(t*2-d, 0, c, d) * .5 + c*.5 + b;
		}
	}
}

Q.Animate = Q.extend( {
func : null,
bind : null,
timer: null,
begin: 0,
duration: 0,
max  : 0,
construct : function(cfg) {
   var _this = this;
   if(cfg.tween == 'Linear' || !Tween[cfg.tween] ) {
      _this.func = Tween.Linear;
   } else {
      if(Tween[cfg.tween][cfg.ease]) {
	     _this.func = Tween[cfg.tween][cfg.ease];
	  } else {
	     _this.func = Tween[cfg.tween]['easeIn'];
	  }
   }
 
   _this.bind = cfg.bind;
   _this.duration = cfg.duration;
   _this.max = cfg.max;
   _this.begin = cfg.begin;
   

   return this;
},
play : function(){
	var _this = this;
	// var oM = $("idMove").style, oL = $("idLine").style, 
	//var t=0, c=300, d=10;  // d = iDuration
	var t=_this.begin, c=_this.max, d=_this.duration;  // d = iDuration
	// oM.left=oL.left="0px"; 
	clearTimeout(_this._timer);
	function _run(){
		if(t<d){
			t++;
			_this.bind(Math.ceil(_this.func(t,0,c,d)));
			// oM.left = Math.ceil(_this.func(t,0,c,d)) + "px";
			// oL.left = Math.ceil(Tween.Linear(t,0,iChart,d)) + "px";
			_this._timer = setTimeout(_run, 10);
		} else {
			_this.bind(c);
			// oM.left = c + "px";
			// oL.left = iChart + "px";
		}
	}
	_run();
}

});
/*************** import file calendar.js***************/
var controlid = null;
var currdate = null;
var startdate = null;
var enddate  = null;
var yy = null;
var mm = null;
var hh = null;
var ii = null;
var currday = null;
var addtime = false;
var today = new Date();
var lastcheckedyear = false;
var lastcheckedmonth = false;

function _cancelBubble(event) {
  e = event ? event : window.event ;
  if(document.all) {
    e.cancelBubble = true;
  } else {
    e.stopPropagation();
  }
}

function loadcalendar() {
  s = '';
  s += '<div id="calendar" style="display:none; position:absolute; z-index:9;" onclick="_cancelBubble(event)">';
  if (document.all)
  {
    s += '<iframe width="200" height="160" src="about:blank" style="position: absolute;z-index:-1;"></iframe>';
  }
  s += '<div style="width: 200px;"><table class="tableborder" cellspacing="0" cellpadding="0" width="100%" style="text-align: center">';
  s += '<tr align="center" class="header"><td class="header"><a href="#" onclick="refreshcalendar(yy, mm-1);return false" title="上一月">&lt;&lt;</a></td><td colspan="5" style="text-align: center" class="header"><a href="#" onclick="showdiv(\'year\');_cancelBubble(event);return false" title="点击选择年份" id="year"></a>&nbsp;/ &nbsp;<a id="month" title="点击选择月份" href="#" onclick="showdiv(\'month\');_cancelBubble(event);return false"></a></td><td class="header"><A href="#" onclick="refreshcalendar(yy, mm+1);return false" title="下一月">&gt;&gt;</A></td></tr>';
  s += '<tr class="category"><td>日</td><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td></tr>';
  for(var i = 0; i < 6; i++) {
    s += '<tr class="altbg2">';
    for(var j = 1; j <= 7; j++)
      s += "<td id=d" + (i * 7 + j) + " height=\"19\">0</td>";
    s += "</tr>";
  }
  s += '<tr id="hourminute"><td colspan="7" align="center"><input type="text" size="1" value="" id="hour" onKeyUp=\'this.value=this.value > 23 ? 23 : zerofill(this.value);controlid.value=controlid.value.replace(/\\d+(\:\\d+)/ig, this.value+"$1")\'> 点 <input type="text" size="1" value="" id="minute" onKeyUp=\'this.value=this.value > 59 ? 59 : zerofill(this.value);controlid.value=controlid.value.replace(/(\\d+\:)\\d+/ig, "$1"+this.value)\'> 分</td></tr>';
  s += '</table></div></div>';
  s += '<div id="calendar_year" onclick="_cancelBubble(event)"><div class="col">';
  for(var k = 1930; k <= 2019; k++) {
    s += k != 1930 && k % 10 == 0 ? '</div><div class="col">' : '';
    s += '<a href="#" onclick="refreshcalendar(' + k + ', mm);$(\'calendar_year\').style.display=\'none\';return false"><span' + (today.getFullYear() == k ? ' class="today"' : '') + ' id="calendar_year_' + k + '">' + k + '</span></a><br />';
  }
  s += '</div></div>';
  s += '<div id="calendar_month" onclick="_cancelBubble(event)">';
  for(var k = 1; k <= 12; k++) {
    s += '<a href="#" onclick="refreshcalendar(yy, ' + (k - 1) + ');$(\'calendar_month\').style.display=\'none\';return false"><span' + (today.getMonth()+1 == k ? ' class="today"' : '') + ' id="calendar_month_' + k + '">' + k + ( k < 10 ? '&nbsp;' : '') + ' 月</span></a><br />';
  }
  s += '</div>';

  var nElement = document.createElement("div");
  nElement.innerHTML=s;
  document.getElementsByTagName("body")[0].appendChild(nElement);

//  document.write(s);
  document.onclick = function(event) {
    Q.$('calendar').style.display = 'none';
    Q.$('calendar_year').style.display = 'none';
    Q.$('calendar_month').style.display = 'none';
  }
  Q.$('calendar').onclick = function(event) {
    _cancelBubble(event);
    Q.$('calendar_year').style.display = 'none';
    Q.$('calendar_month').style.display = 'none';
  }
}

function parsedate(s) {
  /(\d+)\-(\d+)\-(\d+)\s*(\d*):?(\d*)/.exec(s);
  var m1 = (RegExp.$1 && RegExp.$1 > 1899 && RegExp.$1 < 2101) ? parseFloat(RegExp.$1) : today.getFullYear();
  var m2 = (RegExp.$2 && (RegExp.$2 > 0 && RegExp.$2 < 13)) ? parseFloat(RegExp.$2) : today.getMonth() + 1;
  var m3 = (RegExp.$3 && (RegExp.$3 > 0 && RegExp.$3 < 32)) ? parseFloat(RegExp.$3) : today.getDate();
  var m4 = (RegExp.$4 && (RegExp.$4 > -1 && RegExp.$4 < 24)) ? parseFloat(RegExp.$4) : 0;
  var m5 = (RegExp.$5 && (RegExp.$5 > -1 && RegExp.$5 < 60)) ? parseFloat(RegExp.$5) : 0;
  /(\d+)\-(\d+)\-(\d+)\s*(\d*):?(\d*)/.exec("0000-00-00 00\:00");
  return new Date(m1, m2 - 1, m3, m4, m5);
}

function settime(d) {
  Q.$('calendar').style.display = 'none';
  controlid.value = yy + "-" + zerofill(mm + 1) + "-" + zerofill(d) + (addtime ? ' ' + zerofill(Q.$('hour').value) + ':' + zerofill(Q.$('minute').value) : '');
}

function showcalendar(event, controlid1, addtime1, startdate1, enddate1) {
  controlid = controlid1;
  addtime = addtime1;
  startdate = startdate1 ? parsedate(startdate1) : false;
  enddate = enddate1 ? parsedate(enddate1) : false;
  currday = controlid.value ? parsedate(controlid.value) : today;
  hh = currday.getHours();
  ii = currday.getMinutes();
  var p = Q.absPosition(Q.$(controlid));
  Q.$('calendar').style.display = 'block';
  Q.$('calendar').style.left = (p.left+p.width+1)+'px';
  Q.$('calendar').style.top  = (p.top+2)+'px';
  _cancelBubble(event);
  refreshcalendar(currday.getFullYear(), currday.getMonth());
  if(lastcheckedyear != false) {
    Q.$('calendar_year_' + lastcheckedyear).className = 'default';
    Q.$('calendar_year_' + today.getFullYear()).className = 'today';
  }
  if(lastcheckedmonth != false) {
    Q.$('calendar_month_' + lastcheckedmonth).className = 'default';
    Q.$('calendar_month_' + (today.getMonth() + 1)).className = 'today';
  }
  Q.$('calendar_year_' + currday.getFullYear()).className = 'checked';
  Q.$('calendar_month_' + (currday.getMonth() + 1)).className = 'checked';
  Q.$('hourminute').style.display = addtime ? '' : 'none';
  lastcheckedyear = currday.getFullYear();
  lastcheckedmonth = currday.getMonth() + 1;
}

function refreshcalendar(y, m) {
  var x = new Date(y, m, 1);
  var mv = x.getDay();
  var d = x.getDate();
  var dd = null;
  yy = x.getFullYear();
  mm = x.getMonth();
  $("year").innerHTML = yy;
  $("month").innerHTML = mm + 1 > 9  ? (mm + 1) : '0' + (mm + 1);

  for(var i = 1; i <= mv; i++) {
    dd = $("d" + i);
    dd.innerHTML = "&nbsp;";
    dd.className = "";
  }

  while(x.getMonth() == mm) {
    dd = $("d" + (d + mv));
    dd.innerHTML = '<a href="###" onclick="settime(' + d + ');return false">' + d + '</a>';
    if(x.getTime() < today.getTime() || (enddate && x.getTime() > enddate.getTime()) || (startdate && x.getTime() < startdate.getTime())) {
      dd.className = 'expire';
    } else {
      dd.className = 'default';
    }
    if(x.getFullYear() == today.getFullYear() && x.getMonth() == today.getMonth() && x.getDate() == today.getDate()) {
      dd.className = 'today';
      dd.firstChild.title = '今天';
    }
    if(x.getFullYear() == currday.getFullYear() && x.getMonth() == currday.getMonth() && x.getDate() == currday.getDate()) {
      dd.className = 'checked';
    }
    x.setDate(++d);
  }

  while(d + mv <= 42) {
    dd = $("d" + (d + mv));
    dd.innerHTML = "&nbsp;";
    d++;
  }

  if(addtime) {
    Q.$('hour').value = zerofill(hh);
    Q.$('minute').value = zerofill(ii);
  }
}

function showdiv(id) {

  var p = Q.absPosition(Q.$(id));
  Q.$('calendar_' + id).style.left = p.left+'px';
  Q.$('calendar_' + id).style.top = (p.top + 16)+'px';
  Q.$('calendar_' + id).style.display = 'block';
}

function zerofill(s) {
  var s = parseFloat(s.toString().replace(/(^[\s0]+)|(\s+$)/g, ''));
  s = isNaN(s) ? 0 : s;
  return (s < 10 ? '0' : '') + s.toString();
}

Q.Ready(function() {
  loadcalendar();
});
/*************** import file wndx-1-0-2.js***************/
/*--------------------------------------------------------------------------------
 $ 文档：wndx.js
 $ 功能：封装的窗口api和相关定义
 $ 日期：2007-10-09 15:47
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://jshtml.com] All rights reservered.
----------------------------------------------------------------------------------*/

// global const variables definition
var CONST = {
  SW_SHOW:           0x0001,
  SW_HIDE:           0x0000,

// window style
  STYLE_TITLE:     0x00000001,
  STYLE_MENU :     0x00000002,
  STYLE_TOOLBAR :  0x00000004,
  STYLE_STATUS:    0x00000008,
  STYLE_FIXED:     0x00000010,

// size status
  STYLE_MAX :      0x00000020,
  STYLE_MIN :      0x00000040,
  STYLE_CLOSE :    0x00000080,

  STYLE_ICON  :    0x00000100,
  STYLE_WITHBOTTOM :  0x00000200,
  
// size text
  SIZE_CLOSE:    'close',
  SIZE_MIN:      'min',
  SIZE_MAX:      'max',
  SIZE_NORMAL:   'normal',
  SIZE_RESIZE :  3,
  SIZE_DRAGING:  4,
  SIZE_RESIZING: 5,
  SIZE_MINING :  6,

// dialog define
  IDCANCEL :          '0'
};

CONST.STYLE_DEFAULT = CONST.STYLE_TITLE|CONST.STYLE_ICON|CONST.STYLE_MAX|CONST.STYLE_MIN|CONST.STYLE_CLOSE;

var __GLOBALS = {};
__GLOBALS.MIN_HEIGHT = 32;
__GLOBALS.MIN_WIDTH  = 100;
__GLOBALS.Z_INDEX    = 10000;
__GLOBALS.count      = 0;
__GLOBALS.appid      = -1;
__GLOBALS.apps       = {};

// global windows intitalize  
Q.Ready(function() {
  __GLOBALS.desktop = document.body;
  __GLOBALS.desktop.hook = new Q.LIST();
  __GLOBALS.desktop.wnds   = new Q.LIST();  // popups windows
  __GLOBALS.desktop.active_child = null;
  __GLOBALS.explorer = new Q.UIApplication();
  $CreateMaskLayer(__GLOBALS.desktop);
  (new __DRAGWND());

}, true);


/*-------------------------------------------------------------------------
 application base class
 manage the resources, i.e Q.Window
---------------------------------------------------------------------------*/
Q.Application = Q.extend({
id : -1,   // application id
construct : function(params) {
  // generator app id
  this.id = ++__GLOBALS.appid;
  __GLOBALS.apps[this.id] = this;
},

end : function() {
  delete __GLOBALS.apps[this.id];
},

});

Q.UIApplication = Q.Application.extend({
wnds_map: null,
construct : function(params) {
  this.__super__.construct.call(this, arguments);
  this.wnds_map = new Q.LIST();
},

add_window   : function(wndNode) { this.wnds_map.append(wndNode); },
erase_window : function(wndNode) { this.wnds_map.erase(wndNode); },
});

//  Q.Application end

/*-----------------------------------------------------------------
  common APIs
-------------------------------------------------------------------*/
// check the statement wether be null
function $IsNull(statement) { return  (statement == null); }
function $IsStyle(cs, style) { return ((cs & style) == style); }
function $IsWithStyle(style, wstyle) { return ((style & wstyle) == style); }


/*-----------------------------------------------------------------
  windows APIs
-------------------------------------------------------------------*/
function register_hook(h) {
  __GLOBALS.desktop.hook.append(h);
}

function unregister_hook(h) {
  __GLOBALS.desktop.hook.erase(h);
}

function invoke_hook(hwnd, message_id) {
  __GLOBALS.desktop.hook.each(function(f) {
    f(hwnd, message_id);
  });
}

function $IsDesktopWindow(wndNode) { return (__GLOBALS.desktop == wndNode); }
function $IsWindow(wndNode)        { return (!$IsNull(wndNode)) && (wndNode.nodeType == Q.ELEMENT_NODE) && wndNode.getAttribute('__QWindow__');}
function $IsMaxWindow(wndNode)     { return ($IsStyle($GetWindowStyle(wndNode), CONST.STYLE_MAX) && (CONST.SIZE_MAX == $GetWindowStatus(wndNode))); }
function $BindWindowMessage(wndNode, messageid, parameters) {
  return function() {
    wndNode.wnd_proc(wndNode, messageid, parameters);
  }
} 

function $MaskWindow(wndNode, bmask) { 
  var layer_mask = $GetMask(wndNode);
  if($IsDesktopWindow(wndNode)) {
    if(bmask) {
      layer_mask.body_style = document.body.currentStyle.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = layer_mask.body_style;
    }
  }
  $GetMask(wndNode).style.display=(!!bmask)?'':'none'; 
}
function $CreateMaskLayer(wndNode) {
  wndNode.layer_mask = document.createElement('DIV');
  wndNode.layer_mask.body_style = document.body.currentStyle.overflow;
  wndNode.layer_mask.className = 'clsMaskWindow alpha_1';
  wndNode.appendChild(wndNode.layer_mask);
  wndNode.layer_mask.style.display = 'none';
  wndNode.layer_mask.onmousedown = Q.bind_handler(wndNode, function(evt) { 
    evt = evt || window.event;
    $BindWindowMessage(this, MESSAGE.ACTIVATE)();
    // 取消事件冒泡，防止ActivateWindow被调用到
    evt.cancelBubble = true;
    return false; 
  });
  wndNode.layer_mask.onselectstart = function() { return false; }
}

function $ShowWindow(wndNode, ws)  {
  if( ws == CONST.SW_SHOW ){
    wndNode.style.display = '';
    $ActivateWindow(wndNode);
  } else if( ws == CONST.SW_HIDE ) {
    wndNode.style.display = 'none';
    $MaskWindow(wndNode, false);
  }
}

/*----------------------------------------------------
 窗口激活模式 $ActiveWindow

RootWindow (__GLOBALS.desktop)  
 |               
 +--active_child---> Window 1 
 |        +---------------- child window 1
 |        +---active_child---> child window 2
 |        +---------------- child window 3
 |
 +-------------- Window 2
 +-------------- Window 3
------------------------------------------------------*/
function $ActivateWindow(wndNode, zindex) {
  if(!$IsWindow(wndNode))
    return;
  Q.printf("active window " + $GetTitleText(wndNode));
  var defined_zindex = 0;
  if(!isNaN(zindex)) 
    defined_zindex = zindex;

  var parent_container = $GetContainerWindow(wndNode);
  $SetActiveChild(parent_container, wndNode);
    // set zindex
  var top_sibling = $GetTopZIndexWindow(parent_container);
  var z_active_sibling = $GetWindowZIndex(top_sibling)+1;
  $SetWindowZIndex(wndNode, (defined_zindex)?defined_zindex:z_active_sibling);
  $SetWindowActive(top_sibling, false);
  $SetWindowActive(wndNode, true);
}

function $SetWindowActive(wndNode, IsActive){
  var style;
  style = (IsActive) ? 'clsActiveTitle' : 'clsNoActiveTitle';
  
  var active_child = wndNode;
  while(active_child) {
    $GetTitle(active_child).className = style;
    active_child = $GetActiveChild(active_child);
  }
}

function $MaxizeWindow(wndNode){
  var ws = $GetWindowStyle(wndNode);
  if( $GetWindowStatus(wndNode) == CONST.SIZE_MAX ) { return; };
  var parent_container = $GetContainerWindow(wndNode);
  var width, height;
  if( parent_container == document.body ) {
    width = Math.max(document.body.clientWidth, document.body.scrollWidth);
    height = Math.max(document.body.clientHeight, document.body.scrollHeight);
  } else if( $IsWindow(parent_container) ) {
    width  = Math.max($GetClient(parent_container).clientWidth, $GetClient(parent_container).scrollWidth);
    height = Math.max($GetClient(parent_container).clientHeight, $GetClient(parent_container).scrollHeight);
  } else {  return;  }
  $ChangeCtrlButton(wndNode, CONST.SIZE_MAX, CONST.SIZE_NORMAL);
  $SetWindowPosition(wndNode, 0, 0, width, height);
  $SetWindowStatus(wndNode, CONST.SIZE_MAX);
}

function $RestoreWindow(wndNode){
  if( !$IsWindow(wndNode) ) {  return; }  
  $ChangeCtrlButton(wndNode, CONST.SIZE_MAX, CONST.SIZE_MAX);
  $MoveTo(wndNode, wndNode.rleft, wndNode.rtop);
  $ResizeTo(wndNode, wndNode.rwidth, wndNode.rheight);
  $SetWindowStatus(wndNode, CONST.SIZE_NORMAL);
}

function $MinimizeWindow(wndNode){
  if( $GetWindowStatus(wndNode) == CONST.SIZE_NIN )
    return;
  var ws = $GetWindowStyle(wndNode);
  if( $IsStyle(ws, CONST.STYLE_FIXED)) { return; }
  //wndNode.width = 0;
  //wndNode.style.width = 0;
  var width, height;
  var pos = Q.absPosition(wndNode);  
  $ResizeTo(wndNode, pos.right-pos.left, $GetTitle(wndNode).offsetHeight);
  $ChangeCtrlButton(wndNode, CONST.SIZE_MAX, CONST.SIZE_MAX);
  $SetWindowStatus(wndNode, CONST.SIZE_MIN);
}

function $FitWindow(wndNode) {
  var client = $GetClient(wndNode);
  var oldOverFlow = client.style.overflow;
  client.style.overflow = 'visible';
    
  var ws = $GetWindowStyle(wndNode);
  var lastHeight = client.scrollHeight;
  if( $IsStyle(ws, CONST.STYLE_TITLE)) {
    lastHeight = lastHeight + $GetTitle(wndNode).offsetHeight;
  }
    
  if( $IsStyle(ws, CONST.STYLE_WITHBOTTOM)) {
    lastHeight = lastHeight + ($GetBottomBar(wndNode).offsetHeight);
  }
    
  $ResizeTo(wndNode, client.scrollWidth, lastHeight);  // 自适应内容长度
  client.style.overflow = oldOverFlow;
}

/*-----------------------------------------------------------------
  windows APIs Set Methods
-------------------------------------------------------------------*/

function $SetWindowPosition(wndNode, left, top, width, height) {
    $SaveRectForWindow(wndNode);
    $MoveTo(wndNode, left, top);
    $ResizeTo(wndNode, width, height);
}

function $SetWindowTitle(wndNode, title){
  wndNode.title_text = title;
  wndNode.hTitle.hTitleContent.innerText = title;
}

function $SaveRectForWindow(wndNode) {
    if( $GetWindowStatus(wndNode) == CONST.SIZE_NORMAL ) {
      wndNode.rtop    = parseInt(wndNode.style.top, 10);
      wndNode.rleft   = parseInt(wndNode.style.left, 10);
      wndNode.rwidth  = wndNode.offsetWidth;
      wndNode.rheight = wndNode.offsetHeight;
    }
}

function $SetActiveChild(wndNode, child)   { wndNode.active_child = child;  }
function $SetWindowStatus(wndNode, status) { wndNode.status_type  = status; }
function $SetWindowZIndex(wndNode, zIndex) { if( isNaN(parseInt(zIndex)) ) { return; } wndNode.style.zIndex = zIndex; }

/*-----------------------------------------------------------------
  windows APIs Get Methods
-------------------------------------------------------------------*/

function $GetDesktopContainer()    { return __GLOBALS.desktop;   }
function $GetDesktopWindow()       { return __GLOBALS.desktop;   }
function $GetMask(wndNode)         { return wndNode.layer_mask;  }
function $GetActiveChild(wndNode)  { return wndNode.active_child;}
function $GetContainerWindow(wndNode) { return wndNode.container_wnd;  }
function $GetParentWindow(wndNode) { return wndNode.parent_wnd;  }
function $GetWnds(wndNode)         { return wndNode.wnds;        }
function $GetMinCtrlButton(wndNode){ return wndNode.hTitle.hMin; }
function $GetMaxCtrlButton(wndNode){ return wndNode.hTitle.hMax; }
function $GetTitleText(wndNode)    { return wndNode.title_text;  }
function $GetTitleContent(wndNode) { return wndNode.hTitleContent; }
function $GetTitle(wndNode)        { return wndNode.hTitle;      }
function $GetBottomBar(wndNode)    { return wndNode.hBottomBar;  }
function $GetWindowStatus(wndNode) { return wndNode.status_type; }
function $GetWindowStyle(wndNode)  { return wndNode.wstyle;      }
function $GetClient(wndNode)       { return wndNode.hClientArea; }

function $GetWindowZIndex(wndNode){
  if(wndNode && wndNode.style && wndNode.style.zIndex) {
    return parseInt(wndNode.style.zIndex, 10);
  } else {
    return __GLOBALS.Z_INDEX;
  }
}

function $GetTopZIndexWindow(){
  var parent_wnd;
  if( arguments.length > 0 && $IsWindow(arguments[0]) ) {
    parent_wnd = arguments[0];
  } else {
    parent_wnd = $GetDesktopWindow();
  }
  var wnds = $GetWnds(parent_wnd);
  var top_wnd = null; 
 
  wnds.each(function(wnd) {
   if(top_wnd) {
     top_zindex = $GetWindowZIndex(top_wnd);
     wnd_zindex = $GetWindowZIndex(wnd);
     if( wnd_zindex > top_zindex ) {
       top_wnd = wnd;
     }
   } else {
     top_wnd = wnd;
   }
   return true; 
  }); 
  
  return top_wnd;
}

function $MoveTo(wndNode, x, y){
  wndNode.nTop = y;
  wndNode.nLeft = x;
  wndNode.style.top = wndNode.nTop + 'px';
  wndNode.style.left = wndNode.nLeft + 'px';
}

function $ResizeTo(wndNode, width, height){
  if(typeof(wndNode.onresize) == 'function') {
    wndNode.onresize();
  }
   
  width = parseInt(width,10);
  height = parseInt(height, 10);
  
  wndNode.nWidth = width;
  wndNode.nHeight = height;
  wndNode.style.width = width + 'px';
  wndNode.style.height = height + 'px';

  //var client = $GetClient(wndNode);  // 重画客户区
  //var ws = $GetWindowStyle(wndNode);
  //var lastHeight = height;
  
  //if( $IsStyle(ws, CONST.STYLE_TITLE)) {
  //  lastHeight = lastHeight - $GetTitle(wndNode).offsetHeight;
  //}

  //if( $IsStyle(ws, CONST.STYLE_WITHBOTTOM)) {
  //  lastHeight = lastHeight - ($GetBottomBar(wndNode).offsetHeight);
  //}
  //client.style.height = Math.max(lastHeight - 0, __GLOBALS.MIN_HEIGHT)+'px';
  //client.style.width = Math.max(width - 0, __GLOBALS.MIN_WIDTH) + 'px';
}

function $GetWindowClientHeight() {
  var myHeight = 0;
  if (typeof(window.innerHeight) == 'number') {
    //Non-IE
    myHeight = window.innerHeight;
  } else if (document.documentElement && document.documentElement.clientHeight) {
    //IE 6+ in 'standards compliant mode'
    myHeight = document.documentElement.clientHeight;
  } else if (document.body && document.body.clientHeight) {
    //IE 4 compatible
    myHeight = document.body.clientHeight;
  }
  return myHeight;
}

function $CenterWindow(wndNode) {
  var left = (document.body.clientWidth - wndNode.nWidth ) / 2;
//  var top =  (document.body.clientHeight - wndNode.nHeight ) / 2;
  var si = Q.scrollInfo();
  var top =  si.t + (($GetWindowClientHeight() - wndNode.nHeight ) / 2);
  $MoveTo(wndNode, left, top);
}

function $AddDragObject(wndNode, obj) { wndNode.drag_objects.append(obj); }
function $RemoveDragObjects(wndNode, obj) { wndNode.drag_objects.erase(obj); }
function $IsDragObject(wndNode, obj) { if(!$IsWindow(wndNode)) return false;  return wndNode.drag_objects.find(obj); }

function $SetWindowStyle(wndNode, ws){ 
  wndNode.wstyle = ws;
  if($IsStyle(ws, CONST.STYLE_FIXED)) {
    
  }
 
  /* 
  if($IsStyle(ws, CONST.STYLE_TITLE)) {
    wndNode.hTitle.style.display='';
  } else {
    wndNode.hTitle.style.display='none';
  }
  */
  if($IsStyle(ws, CONST.STYLE_MAX)) {  
    $GetMaxCtrlButton(wndNode).style.display='';
  } else {
    $GetMaxCtrlButton(wndNode).style.display='none';
  }
  
  if($IsStyle(ws, CONST.STYLE_MIN)) {
    $GetMinCtrlButton(wndNode).style.display='';
  } else {
    $GetMinCtrlButton(wndNode).style.display='none';
  }
  
  if( $IsStyle(ws, CONST.STYLE_WITHBOTTOM) ) {
    $GetClient(wndNode).className = "clsClientArea clsWithBottom"
    wndNode.hBottomBar.style.display = '';
  } else {
    $GetClient(wndNode).className = "clsClientArea"
    wndNode.hBottomBar.style.display = 'none';
  }
    
  if($IsStyle(ws, CONST.STYLE_CLOSE)) {
    //wndNode.hTitle.style.display=''; 
  } else {
    //wndNode.hTitle.style.display=''; 
  }

  return wndNode.wstyle; 
}

var MESSAGE = {
  CREATE: 0,
  MIN   : 1,
  MAX   : 2,
  CLOSE : 3,
  ACTIVATE : 4,
}

function $DefaultWindowProc(hwnd, msg, data) {
  switch(msg) {
  case MESSAGE.CREATE:
    Q.printf('DefaultWindowProc MESSAGE.CREATE');
    break;  
  case MESSAGE.MIN:
    Q.printf('DefaultWindowProc MESSAGE.MIN');
    $MinimizeWindow(hwnd);
    break;
  case MESSAGE.MAX:
    Q.printf('DefaultWindowProc MESSAGE.MAX');
    if(!$IsStyle($GetWindowStyle(hwnd), CONST.STYLE_MAX))
      return;
    if(hwnd.status_type != CONST.SIZE_MAX) { 
      $MaxizeWindow(hwnd); 
    } else { 
      $RestoreWindow(hwnd); 
    }
    break;
  case MESSAGE.CLOSE:
    Q.printf('DefaultWindowProc MESSAGE.CLOSE');
    $DestroyWindow(hwnd);
    break;  
  
  case MESSAGE.ACTIVATE:
    {
      Q.printf('DefaultWindowProc MESSAGE.ACTIVATE -> ' + $GetTitleText(hwnd));
      var top_wnd = $GetTopZIndexWindow($GetDesktopWindow());
      var top_zindex = $GetWindowZIndex(top_wnd);
      var t = hwnd;

      // 最底部的模式窗口
      while(t && t.modal_prev) 
        t = t.modal_prev;
      // 统计增加的层数
      while(t && t.modal_next) { 
        t = t.modal_next;
        ++top_zindex;  
      }
      // 先激活顶层窗口
      $ActivateWindow(t, ++top_zindex);
      // 一层层设置zindex
      while(t && t.modal_prev) {
        t = t.modal_prev;
        $SetWindowZIndex(t, --top_zindex); 
      }
    }
    break;  
  }
  invoke_hook(hwnd, msg);
}

function $SetWindowProc(wndNode, new_window_proc) {
  if(typeof new_window_proc == 'function') {
    var old_wnd_proc = wndNode.wnd_proc;
    wndNode.wnd_proc = new_window_proc;
    return old_wnd_proc;
  }

  return null;
}

function $CreateCtrlButton(type) {
  var btn = document.createElement('button');  
  btn.innerHTML = '&nbsp;';
  btn.className = type;
  btn.hideFocus = true;
  return btn;
}

function $ChangeCtrlButton(wndNode, type, dsttype){
  var btn;
  if( type == CONST.SIZE_MIN )
    btn = $GetMinCtrlButton(wndNode);
  else if( type == CONST.SIZE_MAX )
    btn = $GetMaxCtrlButton(wndNode);
  btn.className = dsttype;
}

function $CreateWindowTitlebar(hwnd)  {
  var hTitle = document.createElement('DIV');
  hTitle.className = 'clsActiveTitle';
  hTitle.onselectstart = function() { return false; };
  hTitle.ondblclick    = function() { Q.printf('WINDOW title dblclick'); $BindWindowMessage(hwnd, MESSAGE.MAX)(); }

  hTitle.hIcon = document.createElement('IMG');
  hTitle.hIcon.className = 'clsIcon';
  hTitle.appendChild(hTitle.hIcon);
   
  hTitle.hTitleContent = document.createElement('DIV');
  hTitle.hTitleContent.className = 'clsTitleContent';
  hTitle.appendChild(hTitle.hTitleContent);
  
  hTitle.hTitleCtrlBar = document.createElement('DIV');
  hTitle.hTitleCtrlBar.className = 'clsTitleCtrlBar';
  hTitle.appendChild(hTitle.hTitleCtrlBar);
  
  hTitle.hMin = $CreateCtrlButton('min');
  hTitle.hMax = $CreateCtrlButton('max');
  hTitle.hClose = $CreateCtrlButton('close');

  hTitle.hMin.onclick = $BindWindowMessage(hwnd, MESSAGE.MIN);
  hTitle.hMax.onclick = $BindWindowMessage(hwnd, MESSAGE.MAX);
  hTitle.hClose.onclick = $BindWindowMessage(hwnd, MESSAGE.CLOSE);
  
  hTitle.hTitleCtrlBar.appendChild(hTitle.hMin);
  hTitle.hTitleCtrlBar.appendChild(hTitle.hMax);
  hTitle.hTitleCtrlBar.appendChild(hTitle.hClose);

  hwnd.hTitle = hTitle;
  hwnd.appendChild(hTitle);
  $AddDragObject(hwnd, hwnd.hTitle);
  $AddDragObject(hwnd, hwnd.hTitle.hTitleCtrlBar);
  $AddDragObject(hwnd, hwnd.hTitle.hTitleContent);
}


function $CreateWindow(parent_wnd, title, ws, pos_left, pos_top, width, height, app){
  var wstyle = ws || CONST.STYLE_DEFAULT;
  var container      = null;
  var container_wnd  = null;
  if( !$IsWindow(parent_wnd) ) 
    parent_wnd = $GetDesktopWindow();
 
  container = $GetDesktopWindow();
  container_wnd = $GetDesktopWindow();
  
  // 创建窗口
  var hwnd = document.createElement('DIV');
  // user data
  hwnd.setAttribute('__QWindow__', true);  // 设置QWindow标记，用于$IsWindow方法
  hwnd.wstyle       = ws || CONST.STYLE_DEFAULT;  // 窗口样式
  hwnd.parent_wnd   = parent_wnd;
  hwnd.container_wnd = container_wnd;
  hwnd.modal_next   = null;
  hwnd.model_prev   = null;  
  hwnd.wnds         = new Q.LIST();   // 窗口
  hwnd.drag_objects = new Q.LIST();
  hwnd.active_child = null; 
  hwnd.title_text   = title || 'untitled';
  hwnd.status_type  = CONST.SIZE_NORMAL;
  hwnd.wnd_proc     = $DefaultWindowProc;
  hwnd.app = app || __GLOBALS.explorer;
  hwnd.app.add_window(hwnd); 

  // dom attributes
  hwnd.className = 'clsWindows';
  hwnd.style.display = 'none';
  hwnd.style.zIndex = __GLOBALS.Z_INDEX;

  if(isNaN(pos_top)) 
    pos_top = 0;
  if(isNaN(pos_left)) 
    pos_left = 0;
  if(isNaN(width)) 
    width = 300;
  if(isNaN(height)) 
    height = 300;

  hwnd.nTop    = hwnd.rtop = pos_top;
  hwnd.nLeft   = hwnd.rleft = pos_left;
  hwnd.nWidth  = hwnd.rwidth = width;
  hwnd.nHeight = hwnd.rheight = height;
  
  hwnd.style.top    = pos_top + 'px'; 
  hwnd.style.left   = pos_left + 'px';
  hwnd.style.width  = width + 'px'; 
  hwnd.style.height = height + 'px';
  
  // register to wnds
  $GetWnds(container_wnd).append(hwnd);
 
  // 主窗口
  //if( !$IsStyle(ws, CONST.STYLE_FIXED) ) {
    $MakeResizable(hwnd);
  //}
  
  $SaveRectForWindow(hwnd);
  Q.addEvent(hwnd, 'mousedown', $BindWindowMessage(hwnd, MESSAGE.ACTIVATE));

  // initial title bar
  $CreateWindowTitlebar(hwnd);
  $SetWindowTitle(hwnd, hwnd.title_text);

  hwnd.hClientArea = document.createElement('DIV');
  hwnd.hClientArea.className = 'clsClientArea';
  hwnd.appendChild(hwnd.hClientArea);
  
  // bottom bar
  hwnd.hBottomBar = document.createElement('DIV');
  hwnd.hBottomBar.className = 'clsBottomBar';
  hwnd.appendChild(hwnd.hBottomBar);

  // mask window
  $CreateMaskLayer(hwnd);
  
  $SetWindowStyle(hwnd, ws);
  $BindWindowMessage(hwnd, MESSAGE.CREATE)();
  
  // render 
  container.appendChild(hwnd);

  return hwnd;
}

function $DestroyWindow(wndNode) {
  // 清除子窗口
  var child_wnds = $GetWnds(wndNode);
  child_wnds.each(function(wnd) {
    $BindWindowMessage(wnd, MESSAGE.CLOSE)();
    return true;
  });

  // 清除弹出的子窗口
  var parent_container = $GetContainerWindow(wndNode);
  var parent_wnds = $GetWnds(parent_container);
  parent_wnds.each(function(wnd) { 
    if($GetParentWindow(wnd) == wndNode) 
      $BindWindowMessage(wnd, MESSAGE.CLOSE)();
    return true;
  });

  // 从父容器中清除自己
  parent_wnds.erase(wndNode); 
  // 删除渲染节点delete dom   
  wndNode.setAttribute('__QWindow', null);
  wndNode.parentNode.removeChild(wndNode);
  wndNode = 0;

  // 激活相邻窗口 
  var wnd = $GetTopZIndexWindow(parent_container);
  if($IsNull(wnd)) {
    $SetActiveChild(parent_container, null);
  } else if( $IsWindow(wnd) ) {
    $BindWindowMessage(wnd, MESSAGE.ACTIVATE)();
  } else {
    $BindWindowMessage(parent_container, MESSAGE.ACTIVATE)();
  }
}

function $MakeResizable(obj) {
  var d=11;
  var l,t,r,b,ex,ey,cur;
  // 这里存在内存泄露，不需要的时候Q.removeEvent
  // 由于FireFox的CaptureEvents不支持CaptureEvents指定的Element对象
  Q.addEvent(document, 'mousedown', mousedown);
  Q.addEvent(document, 'mouseup',   mouseup);
  Q.addEvent(document, 'mousemove', mousemove);

  function mousedown(evt){
    evt = evt || window.event;
    var status = $GetWindowStatus(obj);
    //Q.printf('mousedown out' + status);
    if( (status != CONST.SIZE_MAX) && (evt.button == Q.LBUTTON) && obj.style.cursor)
    {
      //Q.printf('mousedown in' + status);
      $SetWindowStatus(obj, CONST.SIZE_RESIZING);
      if(obj.setCapture)
        obj.setCapture();
      else if(window.captureEvents)
        window.captureEvents(Event.MOUSEMOVE|Event.MOUSEUP);
    }
  }

  function mouseup(evt){
    evt = evt || window.event;
    var status = $GetWindowStatus(obj);
    if( ( status != CONST.SIZE_MAX ) && ( status == CONST.SIZE_RESIZING ) && ( evt.button == Q.LBUTTON ) )
    {
      //Q.printf('mouseup in '+status);
      obj.draging = false;
      $SetWindowStatus(obj, CONST.SIZE_NORMAL);
      if(obj.releaseCapture)
        obj.releaseCapture();
      else if(window.releaseEvents)
        window.releaseEvents(Event.MOUSEMOVE|Event.MOUSEUP);
    }
  }

  function mousemove(evt) {
    evt = evt || window.event;
    var srcElement = evt.srcElement || evt.target;
    var status = $GetWindowStatus(obj);
    if(( status & CONST.SIZE_MAX ) || ( $IsStyle($GetWindowStyle(obj), CONST.STYLE_FIXED) ) || (status == CONST.SIZE_MIN))
    {
      //Q.printf('wrong status');
      return;  
    }
    if( status == CONST.SIZE_RESIZING ) {
      //Q.printf('move sizing.');  
      var dx=evt.screenX-ex;
      var dy=evt.screenY-ey;

      if(cur.indexOf('w')>-1) l+=dx;
      else if(cur.indexOf('e')>-1) r+=dx;
      if(cur.indexOf('n')>-1) t+=dy;
      else if(cur.indexOf('s')>-1) b+=dy;

      var s = obj.style;
      if(r-l > __GLOBALS.MIN_WIDTH){
        s.left=l+'px';
        s.width = (r-l) +'px';
      }

      if(b-t > __GLOBALS.MIN_HEIGHT){
        s.top= t+'px';
        s.height= (b-t)+'px';
      }

      $ResizeTo(obj, s.offsetWidth, s.offsetHeight);
      ex+=dx;
      ey+=dy;
    } else if( srcElement == obj ) {
      //Q.printf('caculate cursor style');  
      var x = evt.offsetX==undefined?evt.layerX:evt.offsetX;
      var y = evt.offsetY==undefined?evt.layerY:evt.offsetY;
      var c=obj.currentStyle;
      w=parseInt(c.width,  10);
      h=parseInt(c.height, 10);
      var current_style_left = parseInt(c.left, 10);
      var current_style_top  = parseInt(c.top, 10);

      //Q.printf('x='+x+';y='+y+';w='+w+';h='+h);
      // 计算鼠标样式
      cur=y<d?'n':h-y<d?'s':'';
      cur+=x<d?'w':w-x<d?'e':'';
      if(cur){
        obj.style.cursor=cur+'-resize';
        l=current_style_left;
        t=current_style_top;
        r=l+w;
        b=t+h;
        ex=evt.screenX;
        ey=evt.screenY;
      } else if(obj.style.cursor) {
        obj.style.cursor='';
      }
    } else {
      obj.style.cursor = '';
    }
  }
}

/*-----------------------------------------------------------------
 $ window dragging
 $ dialog base class
 $ date: 2007-11-20
-------------------------------------------------------------------*/
var __DRAGWND = Q.extend({
  nn6 : Q.isNS6(),
  ie  : Q.isIE(),
  hCaptureWnd : null,
  hDragWnd : null,
  isdrag : false,
  x : 0,
  y : 0,
  beginX : 0,
  beginY : 0,
  endX : 0,
  endY : 0,
  MouseDown_Hanlder : null,
  MouseUp_Handler : null,
  MouseMove_Handler : null,
  isMoved : false,
  tmr : null,
  construct : function(){
    var _this = this;

    // 缓存时间
    _this.MouseDown_Hanlder = function(evt) { _this._MouseDown(evt); }
    _this.MouseUp_Handler = function(evt) { _this._MouseUp(evt); }
    _this.MouseMove_Handler = function(evt) { _this._MouseMove(evt); }

    Q.addEvent(document, 'mousedown', _this.MouseDown_Hanlder);
    Q.addEvent(document, 'mouseup', _this.MouseUp_Handler);
    
    _this.hDragWnd = document.createElement('div');
    document.body.appendChild(_this.hDragWnd);
    _this.hDragWnd.style.cssText = 'position:absolute;display:none;z-index: 1000000; background:#474747;cursor:default;';
    _this.hDragWnd.className = 'alpha_5';
  },

  _MouseDown : function(evt) {
    var _this = this;
    evt = evt || window.event;
    if(evt.button == Q.RBUTTON){ return; } // 屏蔽右键拖动
    var target_wnd = oDragHandle = _this.nn6 ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄
    
    while(target_wnd && (target_wnd.className.indexOf('clsWindow') == -1 ) && target_wnd != $GetDesktopWindow()) {
      target_wnd = target_wnd.parentNode;
    }

    if(target_wnd && (!$IsMaxWindow(target_wnd)) && $IsDragObject(target_wnd, oDragHandle)) {
      var pos = Q.absPosition(target_wnd);
      _this.isdrag = true; 
      _this.hCaptureWnd = target_wnd; 
      _this.beginY = pos.top; //parseInt(_this.hCaptureWnd.style.top+0); 
      _this.y = _this.nn6 ? evt.clientY : evt.clientY; 
      _this.beginX = pos.left; //parseInt(_this.hCaptureWnd.style.left+0); 
      _this.x = _this.nn6 ? evt.clientX : evt.clientX;
        
      _this.hDragWnd.style.display = 'none';
      _this.hDragWnd.style.width = _this.hCaptureWnd.offsetWidth + 'px';
      _this.hDragWnd.style.height = _this.hCaptureWnd.offsetHeight + 'px';
      _this.hDragWnd.style.top = pos.top + 'px'; //_this.hCaptureWnd.style.top;
      _this.hDragWnd.style.left = pos.left + 'px'; //_this.hCaptureWnd.style.left;
        
      // 添加MouseMove事件
      _this.tmr = setTimeout(function() { Q.addEvent(document, 'mousemove', _this.MouseMove_Handler) }, 100);
      return false; 
    }
  },
    
  _MouseMove : function(evt){
    var _this = this;
    _this.isMoved = true;
    evt = evt || window.event
    if (_this.isdrag && !$IsMaxWindow(_this.hCaptureWnd)) {
      _this.hDragWnd.style.display = '';
      var x = (_this.nn6?(_this.beginX+evt.clientX-_this.x):(_this.beginX+evt.clientX-_this.x));
      var y = (_this.nn6?(_this.beginY+evt.clientY-_this.y):(_this.beginY+evt.clientY-_this.y));
      if(x < 0) {  x = 0; }

      if(x+_this.hDragWnd.offsetWidth >  document.body.scrollWidth) {
        x = document.body.scrollWidth - _this.hDragWnd.offsetWidth;
      }

      if(y <0) {y = 0;}
      
      if(y+_this.hDragWnd.offsetHeight >  document.body.scrollHeight) {
        y = document.body.scrollHeight - _this.hDragWnd.offsetHeight;
      }
      
      // 移动拖动窗口位置
      _this.hDragWnd.style.left = x+'px';
      _this.hDragWnd.style.top = y+'px';
      
      // 保存坐标
      _this.endX = x;
      _this.endY = y;

      return false; 
    }
  },

  _MouseUp : function(evt) {
    var _this = this;
    clearTimeout(_this.tmr);
    if(_this.isdrag ) {
      var pos = Q.absPosition(_this.hCaptureWnd.parentNode);
      Q.removeEvent(document,'mousemove',_this.MouseMove_Handler);
      _this.isdrag=false;
      _this.hDragWnd.style.display = 'none';
       
      _this.isMoved && $MoveTo(_this.hCaptureWnd, _this.endX-pos.left, _this.endY-pos.top);
      //$ShowWindow(_this.hCaptureWnd, CONST.SW_SHOW);
    }
    _this.isMoved=false;
  }
});

/*-----------------------------------------------------------------
 $ class Q.Window
 $ dialog base class
 $ date: 2014-05-16
-------------------------------------------------------------------*/
// 创建窗口，并返回一个窗口操作类
Q.Window = Q.extend({
hwnd : null,
construct : function(config) {
  config = config || {};
  var _this = this;
  var title = config.title || '无标题';
  var left  = config.left || 0;
  var top   = config.top || 0;
  var width = config.width || 600;
  var height= config.height || 400;
  var parent_wnd= $GetDesktopWindow();
  if(config.parent instanceof Q.Window) 
    parent_wnd = config.parent.wnd() || $GetDesktopWindow();

  config.wstyle = config.wstyle || CONST.STYLE_DEFAULT;
  this.hwnd = $CreateWindow(parent_wnd, title, config.wstyle, left, top, width, height);  
  this.set_content(config.content);
},

wnd : function() { return this.hwnd; },
set_window_proc : function(new_window_proc) { return $SetWindowProc(this.hwnd, new_window_proc); },
set_zindex : function(zIndex) { $SetWindowZIndex(this.hwnd, zIndex); },

set_content : function(HTMLContent) {
  HTMLContent = HTMLContent || "";
  if(HTMLContent && HTMLContent.nodeType == Q.ELEMENT_NODE) {
    $GetClient(this.hwnd).appendChild(HTMLContent);
    HTMLContent.style.display = '';
  } else {
    $GetClient(this.hwnd).innerHTML = HTMLContent;
  }
},
show : function(isVisible) { $ShowWindow(this.hwnd, (!!isVisible)?CONST.SW_SHOW:CONST.SW_HIDE); },
center : function()        { $CenterWindow(this.hwnd); },
adjust : function()        { $FitWindow(this.hwnd); },
});

/*-----------------------------------------------------------------
 $ class Q.Dialog
 $ dialog base class
 $ date: 2007-11-20
-------------------------------------------------------------------*/
Q.Dialog = Q.Window.extend({
old_window_proc : null,
construct : function(config) {
  config = config || {};
  config.wstyle = config.wstyle || CONST.STYLE_DEFAULT;
  config.wstyle |= CONST.STYLE_FIXED;
  config.wstyle |= CONST.STYLE_CLOSE;
  config.wstyle |= CONST.STYLE_WITHBOTTOM;
  config.wstyle &= ~CONST.STYLE_MAX;
  config.wstyle &= ~CONST.STYLE_MIN;
  config.wstyle &= ~CONST.STYLE_ICON;

  this.__super__.construct.call(this, config);
  this.old_window_proc = this.set_window_proc( (function(qwindow) {
    return function(hwnd, msgid, json) { return qwindow.window_proc(msgid, json);}
  })(this)); 
},

// dialog procedure
window_proc : function(msgid, json) {
  switch(msgid) {
  case MESSAGE.CLOSE:
    $MaskWindow(this.hwnd.modal_prev, false);
    this.hwnd.modal_prev.modal_next = null;
    this.hwnd.modal_prev = null;
    break;
  }

  return this.old_window_proc(this.hwnd, msgid, json);
},

add_bottom_button : function(text, className, lpfunc) {
  var _this = this;
  var ws = $GetWindowStyle(this.hwnd);
  
  if((!$IsStyle(ws, CONST.STYLE_WITHBOTTOM)) || $IsNull($GetBottomBar(this.hwnd))) {
    return false;
  }
  var btn = document.createElement('button');
  $GetBottomBar(this.hwnd).appendChild(btn);
  btn.innerText = text;
  btn.onclick = lpfunc;
  btn.className = className;
  return true;
},

domodal : function(wndNode) {
  Q.printf('domodal window');
  if($IsNull(wndNode)) {
    wndNode = $GetActiveChild($GetDesktopWindow());
    if($IsNull(wndNode)) {
      wndNode = $GetDesktopWindow();
    }
  }
  $MaskWindow(wndNode, true);
  wndNode.modal_next = this.hwnd;
  this.hwnd.modal_prev = wndNode;
  
  this.show(true);
  $ResizeTo(this.hwnd, this.hwnd.nWidth, this.hwnd.nHeight);
  this.center();
},
 
end_dialog : function(code) {
  $BindWindowMessage(this.hwnd, MESSAGE.CLOSE)();
  if( arguments.length > 1 )  
    return arguments[1];
  else 
    return CONST.IDCANCEL;
},

});

/*-----------------------------------------------------------------
  class Q.MessageBox
-------------------------------------------------------------------*/
var MSGBOX_LEFT    = 0x0001;
var MSGBOX_CENTER  = 0x0002;
var MSGBOX_RIGHT   = 0x0004;
var MSGBOX_YES     = 0x0008;  // 是
var MSGBOX_NO      = 0x0010;    // 否
var MSGBOX_CANCEL  = 0x0020;  // 取消
var MSGBOX_YESNO   = MSGBOX_YES | MSGBOX_NO;  // 是/否
var MSGBOX_YESNOCANCEL  = MSGBOX_YES | MSGBOX_NO | MSGBOX_CANCEL;  // 是/否/取消

Q.MessageBox = function(config) {
  config = config || {};
  config.width  = config.width  || 360;
  config.height = config.height || 200;
  var dlg = new Q.Dialog(config);
  dlg.set_content(config.content);
  dlg.onok = config.onok || function() {};
  dlg.onno = config.onno || function() {};
  dlg.oncancel = config.oncancel || function() {};
  config.bstyle = config.bstyle || MSGBOX_YES;
  if( $IsWithStyle(MSGBOX_YES, config.bstyle) ) {
    dlg.add_bottom_button('  是  ', 'sysbtn', Q.bind_handler(dlg, function() {
        var return_ok = true;
        if(this.onok)  { 
          return_ok = this.onok(); 
        }
        if(return_ok) {
          this.end_dialog();
        }          
      }))
  }
    
  if( $IsWithStyle(MSGBOX_NO, config.bstyle) ) {
    dlg.add_bottom_button('  否  ', 'sysbtn', Q.bind_handler(dlg, function(){
        if(this.onno){ this.onno(); }
        this.end_dialog();
      }))
  }

  if( $IsWithStyle(MSGBOX_CANCEL, config.bstyle) ) {
    dlg.add_bottom_button(' 取消 ', 'syscancelbtn', Q.bind_handler(dlg,  function(){
        if(this.oncancel){ this.oncancel(); }
        this.end_dialog();
      }))
  }

  dlg.domodal();
  dlg.adjust();
  dlg.center();
}

/*************** import file waterfall.js***************/
function Waterfall(param){
  this.col = [];
  this.id = typeof param.container == 'string' ? document.getElementById(param.container) : param.container;
  this.colWidth = param.colWidth;
  this.colCount = param.colCount || 4;
  this.cls = param.cls && param.cls != '' ? param.cls : 'box wf-cld';
  this.template = param.template;
  this.mouseover = param.mouseover|| function() {};
  this.mouseout = param.mouseout|| function() {};
  this.click = param.click|| function() {};
  this.onloaditems = param.onloaditems || function(timerout) {};
  this.item_callback = param.item_callback || function(name, row) { return row[name]; }
  this.init(param.animate);
  
}

Waterfall.prototype = {
  animateObject : null,
  cache_scroll_handler: null,
  getByClass: function(cls, p) {
        var arr = [],
        reg = new RegExp("^(\s*" + cls + ")", "g"); //\s+|$
        var nodes = p.getElementsByTagName("*"),
        len = nodes.length;
        for (var i = 0; i < len; i++) {
            if (reg.test(nodes[i].className)) {
                arr.push(nodes[i]);
                reg.lastIndex = 0;
            }
        }
        return arr;
    },
    maxArr: function(arr) {
        var len = arr.length,
        temp = arr[0];
        for (var ii = 1; ii < len; ii++) {
            if (temp < arr[ii]) {
                temp = arr[ii];
            }
        }
        return temp;
    },
    getMarginBottom: function(node) {
        var dis = 0;
        if (node.currentStyle) {
            dis = parseInt(node.currentStyle.marginBottom, 10);
        } else if (document.defaultView) {
            dis = parseInt(document.defaultView.getComputedStyle(node, null).marginBottom, 10);
        }

        if(isNaN(dis))
          dis = 0;

        return dis;
    },

    getMarginTop: function(node) {
        var dis = 0;
        if (node.currentStyle) {
            dis = parseInt(node.currentStyle.marginTop, 10);
        } else if (document.defaultView) {
            dis = parseInt(document.defaultView.getComputedStyle(node, null).marginTop, 10);
        }
        
        if(isNaN(dis))
          dis = 0;

        return dis;
    },

    getMinCol: function(arr) {
        var ca = arr,
        cl = ca.length,
        temp = ca[0],
        minc = 0;
        for (var ci = 0; ci < cl; ci++) {
            if (temp > ca[ci]) {
                temp = ca[ci];
                minc = ci;
            }
        }
        return minc;
    },

  init: function(animate) {
    var _this = this;
    _this.animateObject = animate;
    _this.cache_scroll_handler = function() { _this.onscroll();};
    Q.addEvent(window, 'scroll', _this.cache_scroll_handler, false);
    _this.refresh();
  },

  needload : function() {
    function getScrollTop(){
      var scrollTop=0;
      if(document.documentElement&&document.documentElement.scrollTop){     
        scrollTop=document.documentElement.scrollTop;     
      } else if(document.body){
        scrollTop=document.body.scrollTop;     
      }
      return scrollTop;
    }
       
    function getClientHeight(){
      var clientHeight=0;     
      if(document.body.clientHeight&&document.documentElement.clientHeight){
				var clientHeight = (document.body.clientHeight<document.documentElement.clientHeight)?document.body.clientHeight:document.documentElement.clientHeight;             
      } else {     
        var clientHeight = (document.body.clientHeight>document.documentElement.clientHeight)?document.body.clientHeight:document.documentElement.clientHeight;         
      }     
      return clientHeight;     
    }
       
    function getScrollHeight(){
      return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);     
    }
       
    if((!this.completed) && (getScrollTop()+getClientHeight() >= getScrollHeight() - 500)){
       return true;
    }

    return false;
  },

  onscroll : function() {
    //滚动条未达到页尾则返回
    var _this = this;
    
    if(!_this.needload()) return;
    Q.removeEvent(window, 'scroll', _this.cache_scroll_handler);
    _this.onloaditems(function(){ Q.addEvent(window, 'scroll', _this.cache_scroll_handler, false)});  
  },
  
	set_completed : function() {
		this.completed = true;	
	},
	 
  append_html : function(items) {
    var _this = this;
    var div = document.createElement('div');
    div.innerHTML = items;
    var len = div.childNodes.length;

    for (var i = 0; i < len; i++) {
      var e = div.childNodes[i];
      if(e && e.nodeType && e.nodeType == Q.ELEMENT_NODE) {
        _this.create_item(_this.id, div.childNodes[i]);
      }
    }

    _this.id.style.height = _this.maxArr(_this.col) + "px";
    _this.animateObject && _this.animateObject.play();

  },

  create_item : function(container, new_element) {
    var _this = this;
    var pre_width = 192;
    //new_element.style.opacity = 0.0;
    //new_element.data = item;
    container.appendChild(new_element);
    _this.bind_event(new_element);

    var ming = _this.getMinCol(_this.col);
    new_element.style.left = ming * _this.colWidth + "px";
    new_element.style.top = _this.col[ming] + "px";
    //new_element.style.height = 300 + 'px';
    _this.col[ming] += new_element.offsetHeight + 15;
    _this.animateObject && _this.animateObject.push(new_element);
  },
 
  append : function(items) {
    var _this = this;
    var tpl = _this.template;
    var len = items.length;

    for (var i = 0; i < len; i++) {
        _this.create_item_with_template(_this.id, items[i], tpl);
    }

    _this.id.style.height = _this.maxArr(_this.col) + "px";
    _this.animateObject && _this.animateObject.play();
  },

  create_item_with_template : function(container, item, tpl) {
    var _this = this;
    var pre_width = 192;
    tpl = tpl.replace(/\[\[(\w+)\]\]/ig, 
      function(w,w2,w3,w4) {
        if(w2 == 'width') {
          return pre_width;
        } else if(w2=='height') {
          return (item.height * pre_width) / (item.width*1.0); 
        }
       
	      if(_this.item_callback) {
	        return _this.item_callback(w2, item);
	      }
        return item[w2];
      }
    );
    var new_element = document.createElement('div');
    new_element.className = 'box wf-cld';
    //new_element.style.opacity = 0.0;
    new_element.innerHTML = tpl;
    new_element.data = item;
    container.appendChild(new_element);
    _this.bind_event(new_element);

    var ming = _this.getMinCol(_this.col);
    new_element.style.left = ming * _this.colWidth + "px";
    new_element.style.top = _this.col[ming] + "px";
    //new_element.style.height = 300 + 'px';
    _this.col[ming] += new_element.offsetHeight + 15;
    _this.animateObject && _this.animateObject.push(new_element);
  },

  bind_event: function(e) {
    var _this = this;
    e.onmouseover = function() { _this.mouseover(this); }
    e.onmouseout = function() { _this.mouseout(this); }
    e.onclick = function() { _this.click(this); }
  },

  refresh: function() {
    var _this = this;
    //列高
    var iArr = []; //索引
    var nodes = _this.getByClass(_this.cls, _this.id),
    len = nodes.length;
    for (var i = 0; i < _this.colCount; i++)
      _this.col[i] = 0;

    for (var i = 0; i < len; i++) {
      nodes[i].h = nodes[i].offsetHeight + _this.getMarginBottom(nodes[i]) + _this.getMarginTop(nodes[i]);
      nodes[i].className = "box wf-cld";
      iArr[i] = i;
    }

    for (var i = 0; i < len; i++) {
      var ming = _this.getMinCol(_this.col);
      nodes[i].style.left = ming * _this.colWidth + "px";
      nodes[i].style.top = _this.col[ming] + "px";
      _this.col[ming] += nodes[i].h;
    }

    _this.id.style.height = _this.maxArr(_this.col) + "px";
  },
};

function alpha() {
  var _this = this;

  this.data = [];
  this.play = function() {
  if(_this.data.length == 0) {
     return;
  }
  e = _this.data[0];
  var op = parseFloat(e.style.opacity, 10);
  op += 0.1;
  if(op < 1.0) {
     e.style.opacity = op;
  } else {
     _this.data.shift();
  }
  setTimeout(function() { _this.play();}, 40);
  }

  this.push = function(e) {
    if(e) {
    e.style.opacity = 0.0;
    _this.data.push(e);
  }
  }

  this.completed = function() {return _this.data.length == 0; };
}
/*************** import file common.js***************/


var login_iframe = null;
var login_ok = false;

function gotologin(url) {
  if(login_ok) {
    alert('你已经登录了');
    return;
  }
  var pos = Q.absPosition(Q.$('user-title-bar'));
  if(!login_iframe) {
    login_iframe = document.createElement('iframe');
    document.body.appendChild(login_iframe);
    login_iframe.src = url;
    login_iframe.setAttribute('style', 'position:fixed !important;display:block;border:0px !important;')
    login_iframe.style.width = 600 + 'px';
    login_iframe.style.height = 220 + 'px';
    login_iframe.style.WebkitBoxShadow = "5px 5px 20px rgba(0,0,0,0.5)";

    login_iframe.style.top = -220 + 'px';
    login_iframe.style.display = '';
    var left = (document.body.clientWidth - 600 ) / 2;
    login_iframe.style.left = left+'px';
  // var top =  (document.body.clientHeight - wndNode.nHeight ) / 2;
  }
  
  //try {
    (new Q.Animate({
      tween: 'Cubic',
      ease: 'easyIn',
      max: pos.top+pos.height,
      begin: -60,
      duration: 5,
      bind : function(x) {
        login_iframe.style.top = x+'px';
      }
    })).play();
  //} catch (e) {
  //  alert(e);
  //}


  Q.addEvent(window, 'scroll', 
    function() {
    var pos = Q.absPosition(login_iframe);
    if(pos.top <= getScrollTop()) {
      //console.log(pos.top);
      login_iframe.className = 'main_in_wrapper floating';
    } else {
      login_iframe.className = 'main_in_wrapper';
    }
  }
  , false)
}

function click_deactivate() {
  if (login_iframe) {
    document.body.removeChild(login_iframe);
    login_iframe = null;
  }
}

function user_login_ok() {
  login_ok = true;
}

function user_logout_ok() {
  login_ok = false;
}

function follow_album(api, album_id) {
  Q.Ajax({
    command: api,
    data: {'album_id': album_id},
    oncomplete: function(xmlhttp) {
      //try {
        var resp = Q.json_decode(xmlhttp.responseText);
        if(resp.header == 0) {
	  alert('关注成功');  
	} else if(resp.header == -2) {
          gotologin('http://wayixia.com/index.php?app=wayixia&mod=user&action=login');
	} else {
	  alert('error code: ' + resp.header + '\nmessage: ' + resp.data);
	}
      
      //} catch(e) {
      //  alert(xmlhttp.responseText + "\n\n" + e); 
      //}
    },
    onerror: function(xmlhttp) {
      alert(xmlhttp); 
    }
  });
}

function album_display(id) {
  alert(1)
}

