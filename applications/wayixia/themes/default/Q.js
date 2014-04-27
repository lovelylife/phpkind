/*************** import file Q2.js***************/
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
/*************** import file stl.js***************/

/*--------------------------------------------------------------------------------
 $ basic  type list definition
----------------------------------------------------------------------------------*/
var __NODE = Q.KLASS();	//列表节点结构ṹ
var __LIST = Q.KLASS();	// 链表

__NODE.prototype = {
	next : null,
	prev : null,
	key  : null,
	_initialize : function(key) { this.key = key; }
};

__LIST.prototype = {
	head : null,	// 链表的头部
	tail : null,	// 链表尾部
	current: null,
	length : 0,
	_initialize : function(){
		this.head = new __NODE(null);
		this.tail = new __NODE(null);
		this.head.next = this.tail;
		this.tail.prev = this.head;
		this.current = this.head;
	},
	
	begin : function(){	return this.head.next; },	// not head	use as STL
	end : function(){	return this.tail;	},
	len : function(){	return this.length;	},
	item : function() {	return this.current.key; },
	moveNext : function() {	this.current = this.current.next;	},
	movePrev : function(){	this.current = this.current.prev;	},
	
	push : function(key){
		var node = new __NODE(key);
		this.tail.prev.next = node;
		node.prev = this.tail.prev;
		node.next = this.tail;
		this.tail.prev = node;
		this.length++;
	},
	
	insert : function(key) {
		var node = new __NODE(key);
		this.tail.prev.next = node;
		node.prev = this.tail.prev;
		node.next = this.tail;
		this.tail.prev = node;
		this.length++;
	},
	
	remove : function(key){
		var node = this.find(key);
		if( node == null ){	return false;	}
		this.removeNode(node);
	},
	
	removeNode : function(node) {
		node.prev.next = node.next;
		node.next.prev = node.prev;
		this.length--;
	},
	
	clear : function(){
		for(var node = this.begin(); node != this.end(); node = node.next){
			this.removeNode(node);
		}
	},
	
	find : function(key){
		for(var node = this.begin(); node != this.end(); node = node.next){
			if( node.key == key )	return node;
		}
		return null;
	},
	
	toString : function(){
		var i = 0;
		var str = "";
		for(var node = this.begin(); node != this.end(); node = node.next){
			str += "Node["+i+"]: " + node.key + "\n";
			i++;
		}
		return str;
	}
};


var STRUCT_HASMAP = Q.KLASS();
STRUCT_HASMAP.prototype = {
	base : null,
	length : 0,
	dataIndex : 0,
	_initialize : function() {
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
};/*************** import file xml.js***************/
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
		this.command = 	json.command ? (json.command + '&rnd=' + Round(16)) : null;
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

Q.Animate = Q.KLASS();
Q.Animate.prototype = {
func : null,
bind : null,
timer: null,
begin: 0,
duration: 0,
max  : 0,
_initialize : function(cfg) {
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

}