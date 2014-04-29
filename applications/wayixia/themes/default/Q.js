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

}/*************** import file calendar.js***************/
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
 $ 文档：WndX.js
 $ 功能：封装的窗口api和相关定义
 $ 日期：2007-10-09 15:47
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://onlyaa.com] All rights reservered.

 1. 解决窗口拖动时，鼠标位置
 2. 改进模式对话框遮罩问题
----------------------------------------------------------------------------------*/

// global const variables definition
var CONST = {
/*-------------WINDOWS DEFINE -----------------------------*/
	REGISTEREDWND :		0x0001,
	REGISTEREDTITLE :	0x0002,
	SW_SHOW: 			0x0003,
	SW_HIDE: 			0x0004,
	SW_RESIZE	:		0x0008,
/*-------------WINDOWS STYLE DEFINE 使用前两位作为PWWINDOWS的样式-----------------------------
	----------------------------------------------
	STYLE: |0|0|0|0|0|0|0|0|
	----------------------------------------------*/
// window style
	STYLE_DEFAULT :		0x00000001,
	STYLE_TITLE:		0x00000002,
	STYLE_MENU :		0x00000003,
	STYLE_TOOLBAR :		0x00000008,
	STYLE_STATUS:		0x00000010,
	STYLE_RESIZABLE:	0x00000020,

// size status
	STYLE_MAX :			0x00000040,
	STYLE_MIN :			0x00000080,
	STYLE_CLOSE :		0x00000100,
	STYLE_FIXED :		0x00000200,
	STYLE_POPUP :		0x00000400,

	STYLE_CHILD :		0x00000800,
	STYLE_MULTIWINDOW :	0x00001000,
	STYLE_ICON :		0x00002000,
	STYLE_WITHBOTTOM :  0x00004000,
	MIN_HEIGHT:			60,
	MIN_WIDTH:			140,
	
// size text
	SIZE_CLOSE:			'r',
	SIZE_MIN:			0,
	SIZE_MAX:			1,
	SIZE_NORMAL:		2,
	SIZE_RESIZE :		3,
	SIZE_DRAGING:		4,
	SIZE_RESIZING :		5,
	SIZE_MINING :		6,
/*-------------DIALOG DEFINE --------------------------------*/
	NORMAL :            '0',
	MODE:	            '1',
	MODELESS:           '2',
	IDOK :              '1',
	IDCANCEL :          '0'
};

// message id
var WM_CLOSE = 0x0;

/*-------------------------------------------------------------------------
	you must defined the function MessageProcedure in the handle as a memeber
---------------------------------------------------------------------------*/

function $SendMessage(handle, msgtype, MSG) {
	if( $IsNull(handle) ) { return; }
	if($(handle).MessageProcedure) {
		$(handle).MessageProcedure(msgtype, MSG);
	}	else {
		alert('MessageProcedure not defined');
	}
}

// RECT结构体
function __RECT(top, left, bottom, right) {
	this.top = top;
	this.left = left;
	this.bottom = bottom;
	this.right = right;
}

var __GLOBALS = {
	vtable : null,
	resourceHandle : Q.XMLFile( Q.libDir() + '/res/resource.xml').documentElement
};

/*-----------------------------------------------------------------
	common APIs
-------------------------------------------------------------------*/

// for xquery
function selectSingleElement(XQL) {
    return __GLOBALS['resourceHandle'].selectSingleNode(XQL);
}

// check the statement wether be null
function $IsNull(statement) {
	return  (statement == null);	
}


/*-----------------------------------------------------------------
	windows APIs
-------------------------------------------------------------------*/

function $RegisterWindow(wndNode) {
	if( $IsNull(wndNode) ) {
		alert('wndNode is null');
		return;
	}
	var parent = $GetParentWindow(wndNode);
	if( $IsNull(parent) ){
		alert('register error, invalid parent');
		return;
	}
	parent.wnds.push(wndNode);
}

function $UnRegisterWindow(wndNode) {
	if( $IsNull(wndNode) ) {
		alert('wndNode is null');
		return;
	}
	var parent = $GetParentWindow(wndNode);
	if( $IsNull(parent) ){
		alert('unregister error, invalid parent');
		return;
	}
	parent.wnds.remove(wndNode);
}

function $IsWindow(wndNode){
	var parent = $GetParentWindow(wndNode);
	if( $IsNull(parent) ){
		return false;
	}
	return !$IsNull(parent.wnds.find(wndNode));
}

function $CreateWindow(wndName, wndTitle, ws, left, top, width, height, pParent){
	var wnd = $CreateWindowEx(wndName, wndTitle, ws, left, top, width, height, pParent);
	return wnd;
}

function $ShowWindow(wndNode, ws){
	if( ws == CONST['SW_SHOW'] ){
		wndNode.style.display = '';
		if( $IsWindow(wndNode) )
			$ActivateWindow(wndNode);
	} else if( ws == CONST['SW_HIDE'] ) {
		wndNode.style.display = 'none';
		$MaskWindow(wndNode, false);
	}
}

function $IsStyle(cs, style){
	return ((cs & style) == style) || (cs & CONST['STYLE_DEFAULT'] == CONST['STYLE_DEFAULT'] );
}

function $IsWithStyle(style, wstyle) {
	return ((style & wstyle) == style);
}

// do modifying
function $IsMaxWindow(wndNode) {
	if( !$IsWindow(wndNode) ) {
		alert('error')
		return false;
	}
	var ws = $GetWindowStyle(wndNode);
	if( $IsStyle(ws, CONST['STYLE_MAX']) && (CONST['SIZE_MAX'] == $GetWindowStatus(wndNode))) {
		return true;	
	} else {	return false;	}
}

function $DestroyWindow(wndNode){
	var parent = $GetParentWindow(wndNode);
	if( $IsNull(parent)) {
		alert('system error, close window exception[the window have not been registered]');
		return;
	}
	$RemoveWindow(wndNode);
	$UnRegisterWindow(wndNode);
	wndNode = 0;
	var wnd = $GetTopWindow(parent);
	if( $IsNull(wnd) )
		return;
	if( $IsWindow(wnd) ){
		$ActivateWindow(wnd);
	}
}

function $RemoveWindow(wndNode){
	var maskwnd = $GetMaskWindow(wndNode);
	if(maskwnd) {
		maskwnd.parentNode.removeChild(maskwnd);
	}
	wndNode.parentNode.removeChild(wndNode);
	
}

function $GetActiveWindow(wndNode){
	if( $IsWindow(wndNode.activeWnd) )
		return wndNode.activeWnd;
	else
		return null;
}

function $GetWindowZIndex(wndNode){
	return parseInt(wndNode.style.zIndex, 10);
}

var  $ActivateWindowEvent = function(wndNode){
	return function(){
		$ActivateWindow(wndNode);
	};
}

/*----------------------------------------------------
 窗口激活模式 $ActiveWindow
 input: wndNode - the specified window
 no return;
 principle:
 	there are two window modals, one is modal ,the other is modaless
------------------------------------------------------*/
function $ActivateWindow(wndNode) {
// 激活存在的问题， 弹出窗口没有注册到系统列表当中
// 此时当有弹出窗口时，系统无激活窗口，当弹出窗口关闭时，系统则将默认的激活窗口的深度设置为zIndex
// 所有，会出现在最下层
	if( !$IsWindow(wndNode)) { return; }
	if( $GetModalType(wndNode) == CONST['MODE'] ){
		var tp = $GetParentWindow(wndNode);
		$ActivateWindow(tp);
		$MaskWindow(tp, true);
	}
	var ws = $GetWindowStyle(wndNode);
	var zIndex = 10000;	// 默认的窗口深度

	// 保存当前激活窗口
	var ActiveWnd = $GetActiveWindow(__GLOBALS['vtable']);
	// 获得当前父窗口内的激活窗口
	if( !$IsNull(ActiveWnd) ){ // 如果已经存在激活窗口的话，要将激活窗口的样式改成非激活状态
		if( (ActiveWnd == wndNode) ){ // 当前窗口为激活窗口时，直接返回
			return;
		} else if($IsStyle(ws, CONST['STYLE_CHILD'])) {
			if($GetActiveWindow(ActiveWnd) == wndNode){
				return;
			}
		}
		$SetWindowActive(ActiveWnd, false);
		if( !$IsNull($GetTopWindow()))
			zIndex = $GetWindowZIndex($GetTopWindow())+1;
	}
	var hwndactive = null;	// 待激活窗口
	if( $IsStyle(ws, CONST['STYLE_CHILD']) ) {
		// 如果是子窗口的话，应该将焦点移到父窗口， 而将父窗口的激活窗口设置为该子窗口
		//alert('child')
		hwndactive = $GetParentWindow(wndNode);
		$SetWindowZIndex(hwndactive, zIndex);
		zIndex = zIndex + 1;
		atvwnd = $GetActiveWindow(hwndactive);
		var z = 0;
		if( !$IsNull(atvwnd) ) {
			z = $GetWindowZIndex(atvwnd) + 1;
		}
		$SetWindowZIndex(wndNode, z);
		hwndactive.activeWnd = wndNode;
	} else {
		hwndactive = wndNode;
	}
	$SetWindowZIndex(hwndactive, zIndex);
	$SetWindowActive(hwndactive, true);
	// 如果是模式对话框的话，则激活窗口保存在__GLOBALS['vtable'].activeWnd上
	if( $GetModalType(hwndactive) == CONST['mode'] )
		__GLOBALS['vtable'].activeWnd = $GetParentWindow(hwndactive);
	else
		__GLOBALS['vtable'].activeWnd = hwndactive;
}

/*----------------------------------------------------
 窗口失去焦点 $DeactiveWindow
 input: wndNode - the specified window
 no return;
 function:
 	set the specified window deactive;
------------------------------------------------------*/
function $SetWindowActive(wndNode, IsActive){
	if(!$IsWindow(wndNode) || (wndNode == __GLOBALS['vtable'])) {	return; }
	var style;
	style = (IsActive) ? 'clsActiveTitle' : 'clsNoActiveTitle';
	var ws = $GetWindowStyle(wndNode);
	var titleHandle = $GetTitle(wndNode);
	if( $IsStyle(ws, CONST['STYLE_MULTIWINDOW']) ) { // 多窗口
		titleHandle.className = style;
		var ActiveWnd = $GetActiveWindow(wndNode);
		if( $IsNull(ActiveWnd) )
			return;
		titleHandle = $GetTitle(ActiveWnd);
		titleHandle.className = style;
	} else {
		titleHandle.className = style;
	}		
}

function $MaxizeWindow(wndNode){
	if( !$IsWindow(wndNode) ){ return; }
	var ws = $GetWindowStyle(wndNode);
	if( !$IsStyle(ws, CONST['STYLE_MAX']) ) {	return; }
	if( $GetWindowStatus(wndNode) == CONST['SIZE_MAX'] ) { return; };
	var parent = $GetParentWindow(wndNode);
	var width, height;
    if( parent == document.body ) {
		width = Math.max(document.body.clientWidth, document.body.scrollWidth);
		height = Math.max(document.body.clientHeight, document.body.scrollHeight);
	} else if( $IsWindow(parent) ) {
		width  = Math.max($GetClient(parent).clientWidth, $GetClient(parent).scrollWidth);
		height = Math.max($GetClient(parent).clientHeight, $GetClient(parent).scrollHeight);
	} else {	return;	}
	$ChangeCtrlButton(wndNode, CONST['SIZE_MAX'], CONST['SIZE_NORMAL']);
	$SetWindowPosition(wndNode, 0, 0, width, height);
	$SetWindowStatus(wndNode, CONST['SIZE_MAX']);
}

function $RestoreWindow(wndNode){
	if( !$IsWindow(wndNode) ) {	return; }	
	$ChangeCtrlButton(wndNode, CONST.SIZE_MAX, CONST.SIZE_MAX);
	$MoveTo(wndNode, wndNode.rleft, wndNode.rtop);
	$ResizeTo(wndNode, wndNode.rwidth, wndNode.rheight);
	$SetWindowStatus(wndNode, CONST['SIZE_NORMAL']);
}

function $MinimizeWindow(wndNode){
	if( !$IsWindow(wndNode)) { return; }
	if( $GetWindowStatus(wndNode) == CONST['SIZE_NIN'] )
		return;
	var ws = $GetWindowStyle(wndNode);
	if( $IsStyle(ws, CONST['STYLE_FIXED'])) { return; }
	wndNode.width = 0;
	wndNode.style.width = 0;
	var width, height;
	if( parent == document.body ){
		width = document.body.clientWidth;
		height = document.body.clientHeight;
	} else if( $IsWindow(parent) ) {
		width  = $GetClient(parent).clientWidth;
		height = $GetClient(parent).clientHeight;
	} else { return; }
    
	$MoveTo(wndNode, 0, height - $GetTitle(wndNode).offsetHeight);
	$ResizeTo(wndNode, __GLOBALS['MIN_WIDTH'], $GetTitle(wndNode).offsetHeight);
	$ChangeCtrlButton(wndNode, CONST['SIZE_MAX'], CONST['SIZE_MAX']);
	$SetWindowStatus(wndNode, CONST['SIZE_MIN']);
}

function $FitWindow(wndNode) {
	var client = $GetClient(wndNode);
    var oldOverFlow = client.style.overflow;
	client.style.overflow = 'visible';
    
    var ws = $GetWindowStyle(wndNode);
    var lastHeight = client.scrollHeight;
	if( $IsStyle(ws, CONST['STYLE_TITLE'])) {
        lastHeight = lastHeight + $GetTitle(wndNode).offsetHeight;
	}
    
    if( $IsStyle(ws, CONST['STYLE_WITHBOTTOM'])) {
        lastHeight = lastHeight + ($GetBottomBar(wndNode).offsetHeight);
	}
    
    // alert(clt.scrollHeight +'==='+lastHeight)
	$ResizeTo(wndNode, client.scrollWidth, lastHeight);	// 自适应内容长度
    client.style.overflow = oldOverFlow;
}

function $GetMinizeWindowLength(){
	var len = 0;
	var node = __GLOBALS['vtable'].wnds.begin();
	if( node == __GLOBALS['vtable'].wnds.end() )
		return len;
	for( topWnd = node.key;node != __GLOBALS['vtable'].wnds.end(); node = node.next ){
		if( $GetWindowStatus(node.key) == CONST['SIZE_MIN'] ) { len++; }
		else { continue; }
	}
	return len;
}

/*-----------------------------------------------------------------
	windows APIs Set Methods
-------------------------------------------------------------------*/

function $SetWindowPosition(wndNode, left, top, width, height) {
    $SaveRectForWindow(wndNode);
    $MoveTo(wndNode, left, top);
    $ResizeTo(wndNode, width, height);
}

function $SetTitleText(wndNode, title){
	if(!$IsWindow(wndNode)) {return;}
	wndNode.szTitle = title;
	wndNode.hTitleContent.innerHTML = title;
	
}

function $SaveRectForWindow(wndNode) {
    if( $GetWindowStatus(wndNode) == CONST['SIZE_NORMAL'] ) {
	    wndNode.rtop    = parseInt(wndNode.style.top, 10);
	    wndNode.rleft   = parseInt(wndNode.style.left, 10);
	    wndNode.rwidth  = wndNode.offsetWidth;
	    wndNode.rheight = wndNode.offsetHeight;
    }
}

function $SetTitleWidth(wndNode, width){
	if( !$IsWindow(wndNode) )
		return;
	$GetTitleContent(wndNode).style.width = width + 'px';	
}

function $SetTitleHeight(wndNode, height){
	if( !$IsWindow(wndNode) )
		return;
	$GetTitleContent(wndNode).style.height= height+ 'px';	
}

function $SetWindowStatus(wndNode, status) {
	if( !$IsWindow(wndNode) )
		return;
	wndNode.statusType  = status;	
}

function $SetWindowZIndex(wndNode, zIndex) {
	if( !$IsWindow(wndNode) )
		return;
	if( isNaN(parseInt(zIndex)) ){
		alert('valid number of zIndex');
		return;
	}
	wndNode.style.zIndex = zIndex;
}

function $SetActiveWindow(wndNode){
	if( !$IsWindow(wndNode) )
		return;
	var parent = $GetParentWindow(wndNode);
	parent.activeWnd = wndNode;
}

function $ChangeCtrlButton(wndNode, type, dsttype){
	var btn;
	if( !$IsWindow(wndNode) )
		return;
	if( type == CONST.SIZE_MIN )
		btn = $GetMinCtrlButton(wndNode);
	else if( type == CONST.SIZE_MAX )
		btn = $GetMaxCtrlButton(wndNode);
	btn.innerHTML = dsttype;
}


/*-----------------------------------------------------------------
	windows APIs Get Methods
-------------------------------------------------------------------*/

function $GetModalWindow(wndNode){
	if( $IsNull(wndNode.modalWnd) )
		return wndNode;
	else
		return $GetModalWindow(wndNode.modalWnd);
}

function $GetScrollInfo() {     
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
} 

function $GetParentWindow(wndNode) {
	if( wndNode )
		return 	wndNode.parentHandle; 
	else
		return null;
}

function $GetTitleText(wndNode){
	if(!$IsWindow(wndNode)) {return;}
	return wndNode.szTitle = title;	
}

function $GetSubWindowLength(wndNode){
	if( !$IsWindow(wndNode) )
		return 0;
	return wndNode.wnds.length;
}

function $GetSubWindow(wndNode){
	if( wndNode.wnds.length > 0 ) {
		return wndNode.wnds;
	} else {
		return null;
	}
}
function $GetMinCtrlButton(wndNode){
	if( !$IsWindow(wndNode) )
		return;
	return wndNode.min;
}

function $GetMaxCtrlButton(wndNode){
	if( !$IsWindow(wndNode) )
		return null;
	return wndNode.max;
}

function $GetTitleContent(wndNode){
	if( !$IsWindow(wndNode) )
		return null;
	return wndNode.hTitleContent;
}

function $GetTitle(wndNode){
	if( !$IsWindow(wndNode) )
		return null;
	return wndNode.hTitle;
}

function $GetBottomBar(wndNode) {
    if( !$IsWindow(wndNode) )
        return null;
	return wndNode.hBottomBar;
}

function $GetWindowStatus(wndNode){
	if( !$IsWindow(wndNode) )
		return null;
	return wndNode.statusType ;
}

function $GetWindowStyle(wndNode){
	if( !$IsWindow(wndNode) ) { return null; }
	return wndNode.wstyle;
}

function $GetClient(wndNode){
	if( !$IsWindow(wndNode) ) {	return null; }
	return wndNode.hClientArea;
}

function $GetTopWindow(){
	var topWnd;
	var node = null;
	var parentWnd;
	if( arguments.length > 0 && $IsWindow(arguments[0]) ) {
		parentWnd = arguments[0];
	} else {
		parentWnd = __GLOBALS['vtable'];
	}
	var wnds = $GetSubWindow(parentWnd);
	if( $IsNull(wnds) )
		return null;
	node = wnds.begin();
	if( node == wnds.end() ) {	return null; }
	for( topWnd = node.key;node != wnds.end(); node = node.next ){
		if( parseInt(node.key.style.zIndex) > parseInt(topWnd.style.zIndex) )
			topWnd = node.key;
	}
	return topWnd;
}

// 获得最先显示的深度
function $GetModalZIndex(wndNode) {
	var node;
	for(node = $GetModalWindow(wndNode); $GetModalWindow(node) != null; node = $GetModalWindow(wndNode)) {}
	return $GetWindowZIndex(node);
}

function $GetRect(wndNode) {
	var top, left, bottom, right;
	if(wndNode == __GLOBALS['vtable']) {
		top 	= 0;
		left 	= 0;
		bottom	= document.body.scrollHeight + top;
		right	= document.body.scrollWidth + left;
	} else {
		top		= parseInt(wndNode.style.top, 10);
		left	= parseInt(wndNode.style.left, 10);
		bottom	= parseInt(wndNode.style.top, 10) + wndNode.style.offsetHeight;
		right	= parseInt(wndNode.style.left, 10) + wndNode.style.offWidth;
	}
	return new __RECT(top, left, bottom, right);
}

function $MoveTo(wndNode, x, y){
    if( !$IsWindow(wndNode) ) {
        alert('无效窗口...');
        return;
    }
    wndNode.nTop = y;
	wndNode.nLeft = x;
	wndNode.style.top = wndNode.nTop + 'px';
	wndNode.style.left = wndNode.nLeft + 'px';
}

function $ResizeTo(wndNode, width, height){
	try
	{

	if( !$IsWindow(wndNode) ) {
  	    alert('无效窗口...');
        return;
    }
    
    if(typeof(wndNode.onresize) == 'function') {
        //alert('onresize()');
        wndNode.onresize();
    }
    
	width = parseInt(width,10);
	height = parseInt(height, 10);

	
	wndNode.nWidth = width;
	wndNode.nHeight = height;
	wndNode.style.width = width + 'px';
	wndNode.style.height = height + 'px';
	


	var client = $GetClient(wndNode);	// 重画客户区
	// var title  = $GetTitle(wndNode);
	var ws = $GetWindowStyle(wndNode);
    var lastHeight = height;
    
	if( $IsStyle(ws, CONST['STYLE_TITLE'])) {
        lastHeight = lastHeight - $GetTitle(wndNode).offsetHeight;
	}

    if( $IsStyle(ws, CONST['STYLE_WITHBOTTOM'])) {
        lastHeight = lastHeight - ($GetBottomBar(wndNode).offsetHeight);
	}
    client.style.height = Math.max(lastHeight - 0, CONST['MIN_HEIGHT'])+'px';
    client.style.width = Math.max(width - 0, CONST['MIN_WIDTH']) + 'px';

	}
	catch (e)
	{
		// alert(height +'----'+ width);
	}
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
//	var top =  (document.body.clientHeight - wndNode.nHeight ) / 2;
    var si = $GetScrollInfo();
	var top =  si.t + (($GetWindowClientHeight() - wndNode.nHeight ) / 2);
	$MoveTo(wndNode, left, top);
}

/*-----------------------------------------------------------------
	windows APIs resource api include all of templates resource
-------------------------------------------------------------------*/

function $createHR(){
	var hr = document.createElement('TABLE');
	var tr = hr.insertRow(0);
	tr.insertCell(0)
	hr.style.height = '5px';
	hr.style.width = '98%';
	hr.style.margin = '3px 0 0 3px';
	hr.style.borderTop = '1px solid #999';
	return hr;
}

/*----------------------------------------------------------------------
 $ load resource from configure XML file
------------------------------------------------------------------------*/

function LoadFromResource(uID){
	var XQL = '/resource/menu[@id="system_menu"]/templates[@id="' + uID + '"]';
	var handle = selectSingleElement(XQL); 
	if( $IsNull(handle) ) {return false; }
	return handle;
}

function LoadMenu(hwnd, uID) {};



function $CreateWindowEx(wndName, wndTitle, ws, left, top, width, height, pParent){
	var hwnd = document.createElement('DIV');
	hwnd.IsSubWnd = false;
	hwnd.wstyle = ws;	// 窗口样式
	hwnd.wnds = new __LIST();	
	hwnd.activeWnd = null;	// 当前活动的子窗口句柄
	hwnd.modalwnd = null;	// 从该窗口弹出的模式对话框
	hwnd.maskWnd = document.createElement('DIV');	//用来屏蔽鼠标
	hwnd.maskWnd.className = 'clsMaskWindow alpha_5';
	hwnd.maskWnd.onclick = function() {
		// $ActivateWindow(hwnd);
	}

	hwnd.maskWnd.onselectstart = function() { return false; }

	__GLOBALS['vtable'].appendChild(hwnd.maskWnd);
	var cs = $GetWindowStyle(pParent);
	if( $IsStyle(cs, CONST['STYLE_MULTIWINDOW']) && $IsStyle(ws, CONST['STYLE_CHILD']) ) {
		// 加载子窗口
		$GetClient(pParent).appendChild(hwnd);
		hwnd.parentContainer = pParent;
		hwnd.parentHandle = pParent;
	} else {
		// 通用窗口, 加载到通用容器body里面
		__GLOBALS['vtable'].appendChild(hwnd);
		hwnd.parentContainer = __GLOBALS['vtable'];
		hwnd.parentHandle = ( $IsWindow(pParent)) ? pParent : __GLOBALS['vtable'];
	}

	hwnd.szName = ( wndName != '' )? wndName : 'WndX - QLib WndX';		// 窗口名称
	hwnd.szTitle = ( wndTitle != '' )? wndTitle : 'WndX - QLib WndX';	// 窗口样式
	if( !isNaN(top)) {
		hwnd.nTop = hwnd.rtop = top;
		hwnd.style.top = top; // 窗口顶点位置
	}
	if( !isNaN(left)) {
		hwnd.nLeft = hwnd.rleft = left;
		hwnd.style.left = left; // 窗口左边距离
	}
	
	if( !isNaN(width) ) {
		hwnd.nWidth = hwnd.rwidth = width;
		hwnd.style.width = width;				// 窗口宽度
	}
	if( !isNaN(height) ) {
		hwnd.nHeight = hwnd.rheight = height;
		hwnd.style.height = height;				// 窗口宽度
	}

	// 主窗口
	if( !$IsStyle(ws, CONST['STYLE_FIXED']) ){ $MakeResizable(hwnd);}
	$SaveRectForWindow(hwnd);
	hwnd.setAttribute('IsWindow', CONST['REGISTEREDWND']);
	Q.addEvent(hwnd, 'mousedown', $ActivateWindowEvent(hwnd));
	hwnd.className = 'clsWindows';
	hwnd.modeType = CONST['NORMAL'];
	hwnd.statusType  = CONST['SIZE_NORMAL'];
	// initial title bar
	if( $IsStyle(ws, CONST['STYLE_TITLE']) ) {
		hwnd.hTitle = document.createElement('DIV');
		hwnd.hTitle.className = 'clsActiveTitle';
		hwnd.hTitle.onselectstart = function(){return false;};
		hwnd.appendChild(hwnd.hTitle);
		hwnd.hTitle.oncontextmenu = function(){
		  var status = $GetWindowStatus(hwnd);
		  var type = 'system_wnd_normal';
		  if( status == CONST['SIZE_MIN'] ) {
				type = 'system_wnd_min';
			} else if(status == CONST['SIZE_MAX']) {
			    type = 'system_wnd_max';
			} 
			//LoadMenu(hwnd, type);			
			//__GLOBALS['contextmenu'].show();
			return false;
		}

		Q.addEvent(hwnd.hTitle, 'dblclick', function(){
			if( !$IsStyle(ws, CONST['STYLE_MAX']) )
				return;
			if(hwnd.max.innerHTML.toString() == CONST['SIZE_NORMAL'].toString()){
				$RestoreWindow(hwnd);
			}else{
				$MaxizeWindow(hwnd);
			}
		});
		hwnd.hTitle.setAttribute('IsWindow', CONST['REGISTEREDTITLE']);
		
		if( $IsStyle(ws, CONST['STYLE_ICON'])) {
		    hwnd.hIcon = document.createElement('IMG');
		    //hwnd.hIcon.src = 'images/panelwork.gif';
		    hwnd.hIcon.className = 'clsIcon';
		    hwnd.hTitle.appendChild(hwnd.hIcon);
		}
		
		hwnd.hTitleContent = document.createElement('DIV');
		hwnd.hTitleCtrlBar = document.createElement('DIV');
		
		hwnd.hTitle.appendChild(hwnd.hTitleContent);
        hwnd.hTitle.appendChild(hwnd.hTitleCtrlBar);
        
		hwnd.hTitleContent.className = 'clsTitleContent';
		hwnd.hTitleCtrlBar.className = 'clsTitleCtrlBar';
		hwnd.hTitleContent.innerText = hwnd.szTitle;
		
		if( $IsStyle(ws, CONST['STYLE_MIN']) ) {
			hwnd.min = $CreateCtrlButton(CONST['SIZE_MIN'], 
				function(wnd){ $MinimizeWindow(wnd);}, hwnd );
		}
        if( $IsStyle(ws, CONST['STYLE_MAX']) ) {
			hwnd.max = $CreateCtrlButton(CONST['SIZE_MAX'], function(wnd){
			    if(wnd.statusType  != CONST['SIZE_MAX']){  
			    	$MaxizeWindow(wnd); 
			    } else { 
			    	$RestoreWindow(wnd);   
			    }
		    }, hwnd );
		}
        if( $IsStyle(ws, CONST['STYLE_CLOSE'])) {
			hwnd.close = $CreateCtrlButton(CONST['SIZE_CLOSE'], 
				function(wnd) {	$DestroyWindow(wnd); }, hwnd );
		}
	}    
	hwnd.hClientArea = document.createElement('DIV');
	hwnd.hClientArea.className = 'clsClientArea';
	hwnd.appendChild(hwnd.hClientArea);
    
    if( $IsStyle(ws, CONST['STYLE_WITHBOTTOM']) ) {
        hwnd.hBottomBar = document.createElement('DIV');
        hwnd.appendChild(hwnd.hBottomBar);
		hwnd.hBottomBar.className = 'clsBottomBar';
    }
    
    
	hwnd.style.display = 'none';
	return hwnd;
}

function $CreateCtrlButton(type, lpfuncEvent, hwnd){
	var btn = document.createElement('span');	
	// hwnd.type = 'button';
	hwnd.hTitleCtrlBar.appendChild(btn);
	btn.innerHTML = type;
	btn.className = 'clsCtrlButtonOut';
	btn.bindwnd = hwnd;
	btn.onmouseover = function() { this.className='clsCtrlButtonOver';};
	btn.onmouseout = function() { this.className='clsCtrlButtonOut';};
	btn.onmouseup = function() { lpfuncEvent(this.bindwnd); };
	return btn;
}

function $GetMaskWindow(wndNode){
	//if( wndNode.maskWnd ) { return null; }
	return wndNode.maskWnd;
}

/*-----------------------------------------------------------------
 $MaskWindow
 $parameter: wndNode - which will be masked
 			 bMask - if mask or not
 $date: 2008-05-11
-------------------------------------------------------------------*/

function $MaskWindow(wndNode, bMask){
	if( (!$IsWindow(wndNode)) && (wndNode != __GLOBALS['vtable']) ) {	
		alert('not window object'); 
		return; 
	}
	var maskWnd = $GetMaskWindow(wndNode);	// 获得遮罩窗口句柄及其窗口的深度
	var nIndex = parseInt($GetWindowZIndex(wndNode),10);
    
	if( bMask ) {		// 遮罩该窗口
		var rect = $GetRect(wndNode);	// 获得该窗口的位置， 显示遮罩窗口
		maskWnd.style.display = '';
		maskWnd.style.position = 'absolute';
		/*
        maskWnd.style.top     = rect.top;
		maskWnd.style.left    = rect.left;
        maskWnd.style.width    = (rect.right - rect.left)+'px';
		maskWnd.style.height   = (rect.bottom - rect.top)+'px';
		*/

		maskWnd.style.top     = 0;
		maskWnd.style.left    = 0;
        maskWnd.style.width    = document.body.scrollWidth+'px';
		maskWnd.style.height   = document.body.scrollHeight+'px';

        //if(isNaN(nIndex)) {
        //    nIndex = 1;
        //}
        maskWnd.style.zIndex  = nIndex + 1;
	} else {	// 取消遮罩
		maskWnd.style.display = 'none';
	}
}

function $MakeResizable(obj) {
	var d=7;
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
		if( (status != CONST.SIZE_MAX) 
			&& (evt.button == Q.LBUTTON)
			&& obj.style.cursor)
		{
			Q.printf('mousedown in' + status);
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
	    if( ( status != CONST.SIZE_MAX ) && 
			( status == CONST.SIZE_RESIZING ) && 
			( evt.button == Q.LBUTTON ) )
		{
			Q.printf('mouseup in '+status);
			obj.draging = false;
			$SetWindowStatus(obj, CONST.SIZE_NORMAL);
			if(obj.releaseCapture)
				obj.releaseCapture();
			else if(window.releaseEvents)
				window.releaseEvents(Event.MOUSEMOVE|Event.MOUSEUP);
		}
	}

	function mousemove(evt){
	    evt = evt || window.event;
            var srcElement = evt.srcElement || evt.target;
	    //Q.printf(srcElement);
	    var status = $GetWindowStatus(obj);
		if(( status == CONST.SIZE_MAX ) 
			|| ( status == CONST.SIZE_FIXED) 
			|| (status == CONST.SIZE_MIN))
		{
			Q.printf('wrong status');
			return;	
		}
		if( status == CONST.SIZE_RESIZING ){
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
				if( $IsWindow(obj) ){
					$SetTitleWidth(obj, r - l - 90)
				}
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
			//var x=evt.offsetX,y=evt.offsetY;

			var x = evt.offsetX==undefined?evt.layerX:evt.offsetX;
			var y = evt.offsetY==undefined?evt.layerY:evt.offsetY;
			var c=obj.currentStyle;
			w=parseInt(c.width,  10);
			h=parseInt(c.height, 10);
			var current_style_left = parseInt(c.left, 10);
			var current_style_top  = parseInt(c.top, 10);

			Q.printf('x='+x+';y='+y+';w='+w+';h='+h);
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
			}else if(obj.style.cursor) {
				obj.style.cursor='';
			}
			//Q.printf('current cursor: '+ obj.style.cursor);
		} else {
			//Q.printf('clear cursor style');
			obj.style.cursor = '';
		}
	}
}

/*---------------------------------------------------------
 $ 数据交换 DataExchange
 $ 实用实例:
 		<input id='ddx'/>
		<input id='ddx2'/>
		<button onclick="nDDX.Update2Ctrl(); ">Updata2Ctrl()</button>
		<button onclick="nDDX.Update2Var();">Updata2Var()</button>
 		<script>
		var g_var = new __DDXITEM(1);
		var g_var2 = new __DDXITEM(2);
		var nDDX = new __DATAEXCHANGE;

		window.attachEvent('onload', function() {
			nDDX.HTML_TEXT(ddx, g_var);
			nDDX.HTML_TEXT(ddx2, g_var2);
		})
		<script>
-----------------------------------------------------------*/
var __DDXITEM = Q.KLASS();
var __DATAEXCHANGE = Q.KLASS();

__DDXITEM.prototype = {
	val  : null,	
	e  : null,
	_initialize : function(iid, dexchanger) {
		this.e = Q.$(iid,true);
		this.val = '';
        if(dexchanger) { dexchanger.register(iid, this); }
		
	},
	toString : function() {	return this.val; },
	set : function(val) { this.val = val;  },
	get : function()    { return this.val; },
	value2element : function() { this.e.value = this.val; },
	element2value : function() { this.val = this.e.value;}
};

__DATAEXCHANGE.prototype = {
	item : null,	// 用来保存数据
	_initialize : function(areaObj) {
		this.item = {};
	},

	register : function(iid, varObj) {
		// this.item.push(varObj);
		this.item[iid] = varObj;
	},

	Update2Ctrl : function() {
		for(var name in this.item) {
			this.item[name].value2element();
		}
	},
	Update2Var : function() {
		for(var name in this.item) {
			this.item[name].element2value();
		}
	}
}

/*-----------------------------------------------------------------
 $ class __DIALOG
 $ dialog base class
 $ date: 2007-11-20
-------------------------------------------------------------------*/
var __DIALOG = Q.KLASS();
__DIALOG.prototype = {
	hwnd : null,
	DataExchanger : null,
	_initialize : function(uTemplate, hParent, isSystemResource) {
		
		var self = this;
		var left = 0, top = 0;
		var res = null;
		if( isSystemResource == 'system' ) {
			var XQL = '/resource/dialog/templates[@id="system_dialog"]/item[@id="'+uTemplate+'"]';
			res = selectSingleElement(XQL);
		} else {
			res = __GLOBALS['templatesHandle'].loadconfigure(uTemplate);
		}
		if( !res ) {
			alert('加载资源失败'+uTemplate+'...');
			return;
		}
		var width, height;
		var title, ws;
		width = res.getAttribute('width');
		height = res.getAttribute('height');
		title =  res.getAttribute('title');
		
		width = ($IsNull(width)) ? 500 : width;
		height = ($IsNull(height)) ? 300 : height;
		title = $IsNull(title) ? 'Q.window' : title;
		var tws = res.getAttribute('wstyle')
		
		if(!tws) {
			ws = CONST['STYLE_DEFAULT'];
		} else {
			tws = tws.split('|');
			for(var i = 0; i < tws.length; i++) {  ws = ws | CONST[tws[i]];	}
		}
		if( !$IsWindow(hParent) || (hParent == __GLOBALS['vtable']) ){
			hParent = __GLOBALS['vtable'];
			left = (document.body.clientWidth - width ) / 2;;
			top =  (document.body.clientHeight - height ) / 2;;
		} else {
			left = hParent.nLeft;
			top = hParent.nTop;
		}
		
		this.hwnd = $CreateWindow('dialog', title, ws, left, top, width, height, hParent);	
		$RegisterWindow(this.hwnd);
		$ResizeTo(this.hwnd, width, height);
		
		this.DataExchanger = new __DATAEXCHANGE;
		if( isSystemResource != 'system' ) {
			// alert(__GLOBALS['templatesHandle'].load(uTemplate));
			$IndirectCreateDialog(this, __GLOBALS['templatesHandle'].load(uTemplate), ws);
		}
	},
	
	_initialDialog : function(){},	// virtual function to be overrided
	
	addBottomButton : function(text, className, lpfunc) {
		var _this = this;
		var hwnd = $GetWindow(_this);
		var ws = $GetWindowStyle(hwnd);
		
		if((!$IsStyle(ws, CONST['STYLE_WITHBOTTOM'])) || $IsNull($GetBottomBar(hwnd))) {
			return false;
		}
		var btn = document.createElement('button');
	    $GetBottomBar(hwnd).appendChild(btn);
		btn.innerText = text;
		btn.onclick = lpfunc;
		btn.className = className;
	},

	destroy : function() {
		var wnd = null;
		hwnd = $IsWindow(this) ? this : $GetWindow(this);
		var parent = $GetParentWindow(hwnd);
		$MaskWindow(parent, false);
		$ActivateWindow(parent);
		$DestroyWindow(hwnd);
	},
	
	doModal : function() {
		// this.hwnd.setAttribute('modeType', CONST['MODE']);
		var parent = $GetParentWindow(this.hwnd);
		$MaskWindow(parent, true);
		parent.modalWnd = this.hwnd;
		var _this = this;
		this.hwnd.close.onmouseup = function() {
				$EndDialog(_this, CONST['IDCANCEL']); 
		};
		$ShowWindow(this.hwnd, CONST['SW_SHOW']);
		$ResizeTo(this.hwnd, this.hwnd.nWidth, this.hwnd.nHeight);
	},
	
	create : function(){
		this.hwnd.modeType = CONST['MODELESS'];
		var parent = $GetParentWindow(this.hwnd);
		parent.wnds.push(this.hwnd);
		$ShowWindow(this.hwnd, CONST['SW_SHOW']);
		$FitWindow(_this.hwnd);
	},
		
	showWindow : function(bShow) {
		var show=bShow?CONST['SW_SHOW']:CONST['SW_HIDE'];
		$ShowWindow(this.hwnd, show);
	},
	
	UpdateData : function(IsUpdate2Variable) {
		if( !IsUpdate2Variable ) 
			this.DataExchanger.Update2Ctrl();
		else
			this.DataExchanger.Update2Var();
	}
};

function $IndirectCreateDialog(dlg, res, ws) {
    $GetClient($GetWindow(dlg)).innerHTML = res;
    $GetWindow(dlg).onresize = function() {
        //if(hclient) {
        //    hclient.style.width = $GetClient(this).offsetWidth - 2;
        //}  
    } 
}

function $GetModalType(wndNode){
	if( !$IsWindow(wndNode) ) {	return; }
	return wndNode.modeType;
}

function $GetWindow(dlg){
	if(!dlg) { return null; }
	if(dlg.hwnd) { return dlg.hwnd; }
	return null;
}

function $EndDialog(dlg) {
	dlg.destroy();
	/*
	var wnd = null;
	hwnd = $IsWindow(dlg) ? dlg : $GetWindow(dlg);
	var parent = $GetParentWindow(hwnd);
	$MaskWindow(parent, false);
	$ActivateWindow(parent);
	$DestroyWindow(hwnd);
	delete dlg.DataExchanger;
	dlg = null;
	delete dlg;
	*/

	if( arguments.length > 1 )  
		return arguments[1];
	else 
		return CONST['IDCANCEL'];
}


var self;
var __DRAGWND = Q.KLASS();
__DRAGWND.prototype = {
	hCaptureWnd : null,
	hDragWnd : null,
	ie  : document.all,
	nn6 : document.getElementById&&!document.all,
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

	_initialize : function(){
		// self = this;		// 传递this指针到事件处理程序中
		var _this = this;

		// 缓存时间
		_this.MouseDown_Hanlder = function(evt) {
			_this._MouseDown(evt);
		}

		_this.MouseUp_Handler = function(evt) {
			_this._MouseUp(evt);
		}

		_this.MouseMove_Handler = function(evt) {
			_this._MouseMove(evt);
		}

		Q.addEvent(document, 'mousedown', _this.MouseDown_Hanlder);
		Q.addEvent(document, 'mouseup', _this.MouseUp_Handler);
		
		_this.hDragWnd = document.createElement('div');
		document.body.appendChild(_this.hDragWnd);
		_this.hDragWnd.style.cssText = 'position:absolute;display:none;z-index: 1000000; background:#474747;cursor:default;';
		_this.hDragWnd.className = 'alpha_5';
		//document.onmousedown = self._initdragment; 
		//document.onmouseup   = function(){ self.isdrag=false; };//$SaveRectForWindow(self.hDragWnd);
	},

	_MouseDown : function(evt){
		var _this = this;
		evt = evt || window.event;
		if(evt.button == 2){ return; } // 屏蔽右键拖动
		var oDragHandle = _this.nn6 ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄
		if( oDragHandle.tagName.toLowerCase() == 'DIV'.toLowerCase() ){
			if( (oDragHandle.parentNode.parentNode.hTitleContent ==	oDragHandle )
				|| (oDragHandle.parentNode.parentNode.hTitleCtrlBar ==	oDragHandle) ){
				oDragHandle = oDragHandle.parentNode;
			}
		}
		if(oDragHandle.tagName == 'DIV' ){		// 暂时支持DIV拖动
			if(oDragHandle.getAttribute('IsWindow')==CONST['REGISTEREDTITLE'] 
				&& oDragHandle.parentNode.getAttribute('IsWindow')==CONST['REGISTEREDWND']){
				_this.isdrag = true; 
				_this.hCaptureWnd = oDragHandle.parentNode; 
				_this.beginY = parseInt(_this.hCaptureWnd.style.top+0); 
				_this.y = _this.nn6 ? evt.clientY : evt.clientY; 
				_this.beginX = parseInt(_this.hCaptureWnd.style.left+0); 
				_this.x = _this.nn6 ? evt.clientX : evt.clientX;
				
				_this.hDragWnd.style.display = 'none';
				_this.hDragWnd.style.width = _this.hCaptureWnd.offsetWidth + 'px';
				_this.hDragWnd.style.height = _this.hCaptureWnd.offsetHeight + 'px';
				_this.hDragWnd.style.top = _this.hCaptureWnd.style.top;
				_this.hDragWnd.style.left = _this.hCaptureWnd.style.left;
				
				
				//$ShowWindow(_this.hCaptureWnd, CONST['SW_HIDE']);
				//document.onmousemove=_this._moveMouse; 
				// 添加MouseMove事件
				Q.addEvent(document, 'mousemove', _this.MouseMove_Handler);
				return false; 
			}
		}
	},
		
	_MouseMove : function(evt){
		var _this = this;
		_this.isMoved = true;
		evt = evt || window.event
		if(!$IsWindow(_this.hCaptureWnd)) { return false; }
		if (_this.isdrag && !$IsMaxWindow(_this.hCaptureWnd)) {
			_this.hDragWnd.style.display = '';
			//var scroll = $GetScrollInfo();
			var x = (_this.nn6?(_this.beginX+evt.clientX-_this.x):(_this.beginX+evt.clientX-_this.x));
			var y = (_this.nn6?(_this.beginY+evt.clientY-_this.y):(_this.beginY+evt.clientY-_this.y));
			if(x < 0) {	x = 0; }

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
		if(_this.isdrag ) {
			Q.removeEvent(document,'mousemove',_this.MouseMove_Handler);
			_this.isdrag=false;
			_this.hDragWnd.style.display = 'none';
			_this.isMoved && $MoveTo(_this.hCaptureWnd, _this.endX, _this.endY);
			$ShowWindow(_this.hCaptureWnd, CONST['SW_SHOW']);
		}
		_this.isMoved=false;
	}
};

/*-----------------------------------------------------------------
	$MessageBox
-------------------------------------------------------------------*/
var MSGBOX_LEFT		= 0x0001;
var MSGBOX_CENTER	= 0x0002;
var MSGBOX_RIGHT	= 0x0004;
var MSGBOX_YES 		= 0x0008;	// 是
var MSGBOX_NO		= 0x0010;		// 否
var MSGBOX_CANCEL	= 0x0020;	// 取消
var MSGBOX_YESNO	= MSGBOX_YES | MSGBOX_NO;	// 是/否
var MSGBOX_YESNOCANCEL	= MSGBOX_YES | MSGBOX_NO | MSGBOX_CANCEL;	// 是/否/取消

// title, msg, ws, lpfuncObj, pParentWnd
function $MessageBox(config) {
    var msgdlg = new __DIALOG('msgbox', config.parent, 'system');
	msgdlg.onok = config.onok || function() {};
	msgdlg.onno = config.onno || function() {};
	msgdlg.oncancel = config.oncancel || function() {};

	var hwnd = $GetWindow(msgdlg);
	$SetTitleText(hwnd, config.title);
	config.content = '<pre style="margin:0;padding:0;"><p style="font-size:14px; color:#666; margin:8px 16px;">' + config.content + '</p></pre>'
	$IndirectCreateDialog(msgdlg, config.content, config.wstyle | CONST['STYLE_WITHBOTTOM']);
    if(!config.wstyle) {
    	config.wstyle = MSGBOX_YES;
    }
    
    if( $IsWithStyle(MSGBOX_YES, config.wstyle) ) {
    	msgdlg.addBottomButton('  是  ', 'sysbtn',
	    	function(){
			  var return_ok = false;
	    		if(msgdlg.onok){ return_ok = msgdlg.onok(); }
				if(return_ok) {
				  $EndDialog(msgdlg);
				}	    		
	    	}
	    )
    }
    
    if( $IsWithStyle(MSGBOX_NO, config.wstyle) ) {
    	msgdlg.addBottomButton('  否  ', 'sysbtn',
	    	function(){
	    		if(msgdlg.onno){ msgdlg.onno(); }
	    		$EndDialog(msgdlg);
	    	}
	    )
    }

	if( $IsWithStyle(MSGBOX_CANCEL, config.wstyle) ) {
		msgdlg.addBottomButton(' 取消 ', 'syscancelbtn',
	    	function(){
	    		if(msgdlg.oncancel){ msgdlg.oncancel(); }
	    		$EndDialog(msgdlg);
	    	}
	    )
    }

    this.close = function() {
	  $EndDialog(msgdlg);
	}

	this.show = function() {
		msgdlg.doModal();
		$FitWindow($GetWindow(msgdlg));
		$CenterWindow(msgdlg.hwnd);
	}

	msgdlg.doModal();
	$FitWindow($GetWindow(msgdlg));
	$CenterWindow(msgdlg.hwnd);
}

Q.MsgBox = $MessageBox;

function $LoadResource(rcFile) {
	__GLOBALS['templatesHandle'] = Q.TemplatesFactory.createTemplate(rcFile);
}

Q.FileDialog = function(json) {
	var _this = this;

	if(!json.App) {
		alert('参数App不能为空!');
		return;
	}

	if( $IsWindow($GetWindow(Q._fDLG)) ) {
		$GetWindow(Q._fDLG).style.display = '';
		return;
	} else {
		Q._fDLG = new __DIALOG('OpenFile', json.ParentWnd);
		var hwnd = $GetWindow(Q._fDLG);
		$SetTitleText(hwnd, '打开文件 Powered By QLib');
        $GetClient(hwnd).innerHTML = '<iframe frameborder="no" src="'+Q.libDir()+'/php/iframe.htm?cfg='+json.App+'&e="'+json.Extensions+' width="100%" height="100%" scrolling="no"></iframe>'; //_this.tplInstance.load('OpenFile');
		Q._fDLG.doModal();
        $FitWindow(hwnd);
        $CenterWindow(hwnd);

		if(json.Type == 'saveas') {
			// 文字
			var text = document.createElement('span');
			text.innerHTML = '文件名称: ';
			$GetBottomBar(hwnd).appendChild(text);
			var input = document.createElement('input');
			$GetBottomBar(hwnd).appendChild(input);

			var sel = document.createElement('select');
			$GetBottomBar(hwnd).appendChild(sel);

			Q._fDLG.fNameCtrl = input;
			Q._fDLG.fExtension = sel;
			
			var types = (json.Extension || '').split(/\s*\|\s*/g);
			for(var i=0; i < types.length; i++) {
				 sel.options.add(new Option(types[i],types[i])); // "text","value"
			}
		}

        Q._fDLG.addBottomButton(json.Type == 'saveas'?' 保 存 ':' 确 定 ', 'sysbtn',  function() {
           // Q._fDLG.UpdateData(true);
           var bCancel = false;
		   //var iframe = document.frames ? $GetClient(hwnd).firstChild.document.window : $GetClient(hwnd).firstChild.contentWindow;
		   var iframe = $GetClient(hwnd).firstChild.contentWindow;
		   var fName = '';
		   if(json.Type == 'saveas') {
				// 保存文件对话框
				var sDir = iframe.GetCurrentDir();
				var sName = Q._fDLG.fNameCtrl.value;
				var sExtension = Q._fDLG.fExtension.value;
				if(sDir == '/') { sDir = ''; }
				fName = sDir + '/' + sName + sExtension;
				
				if((sName == '') || (sExtension == '')) {
					alert('文件名称输入不能为空!');
					bCancel = true;
				}
				
		   } else {
				// 默认选择对话框
				fName = iframe.GetSelectedFileName();
		   }

		   if((!bCancel) && json.OnOK) {
				bCancel = !json.OnOK(fName);
		   }		   

		   (!bCancel) && $EndDialog(Q._fDLG);
        });

		if(json.Type != 'saveas') {
			Q._fDLG.addBottomButton(' 取 消 ', 'syscancelbtn', function() {
				var bCancel = false;
				if(json.OnCancel) {
					bCancel = !json.OnCancel();
				}

				(!bCancel) && $EndDialog(Q._fDLG);
			});
		}
	}
}

// 创建窗口，并返回一个窗口操作类
Q.Window = Q.KLASS();
Q.Window.prototype = {
hwnd : null,
_initialize : function(cfg) {
	var _this = this;
	cfg = cfg || {};
	var title = cfg.title || '无标题';
	// var ws = cfg.wstyle;
	var left = cfg.left || 0;
	var top = cfg.top || 0;
	var width = cfg.width || 600;
	var height = cfg.height || 400;
	var hParent = cfg.parent;
	
	var ws;
	if(!cfg.wstyle) {
		ws = CONST['STYLE_DEFAULT'];
	} else {
		var tws = cfg.wstyle.split('|');
		for(var i = 0; i < tws.length; i++) {  ws = ws | CONST[tws[i]];	}
	}
	_this.hwnd = $CreateWindow('dialog', title, ws, left, top, width, height, hParent);	
	$RegisterWindow(_this.hwnd);
	$MakeResizable(_this.hwnd);
},

show : function(isVisible) {
	var show=isVisible?CONST['SW_SHOW']:CONST['SW_HIDE'];
	$ShowWindow(this.hwnd, show);
},

center : function() {
	$CenterWindow(this.hwnd);
},

getwnd : function() {
	return this.hwnd;
},

setContent : function(HTMLContent) {
	$GetClient(this.hwnd).innerHTML = HTMLContent;
},

setZIndex : function(zIndex) {
	$SetWindowZIndex(this.hwnd, zIndex);
},

};




Q.Ready(function() {
	__GLOBALS['MIN_HEIGHT'] = 32;
	__GLOBALS['MIN_WIDTH'] = 100;

	// global windows	
	__GLOBALS['vtable'] = document.body;
	__GLOBALS['vtable'].wnds = new __LIST();
	__GLOBALS['vtable'].actvieWnd = null;
	__GLOBALS['vtable'].maskWnd = document.createElement('DIV');
	__GLOBALS['vtable'].maskWnd.style.cssText = 'display: none;'
	__GLOBALS['vtable'].appendChild(__GLOBALS['vtable'].maskWnd);

    new __DRAGWND();
});
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
         }else if(document.body){
           scrollTop=document.body.scrollTop;     
         }
         return scrollTop;
       }
       
       function getClientHeight(){
         var clientHeight=0;     
         if(document.body.clientHeight&&document.documentElement.clientHeight){      var clientHeight = (document.body.clientHeight<document.documentElement.clientHeight)?document.body.clientHeight:document.documentElement.clientHeight;             
         }else{     
            var clientHeight = (document.body.clientHeight>document.documentElement.clientHeight)?document.body.clientHeight:document.documentElement.clientHeight;         
         }     
         return clientHeight;     
       }
       
       function getScrollHeight(){
         return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);     
       }
       
       if(getScrollTop()+getClientHeight() >= getScrollHeight() - 500){
          return true;
       }

       return false;
  },

  onscroll : function() {
    //滚动条未达到页尾则返回
    var _this = this;
    
    if(!_this.needload()) return;
      // console.log('load new data');
      //_this.append(g_store.pop(5));
      Q.removeEvent(window, 'scroll', _this.cache_scroll_handler);
      _this.onloaditems(function(){ Q.addEvent(window, 'scroll', _this.cache_scroll_handler, false)});  
      //Q.removeEvent(window, 'scroll', _this.cache_scroll_handler);
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
