/*-------------------------------------------------------
 $ name:  loader
 $ function: Q frame work do some initialize
 $ date: 2011-4-6
 $ author: lovelylife
---------------------------------------------------------*/

// 初始化 Javascript Loader
(function(libs, initf) {

  var pa = new RegExp("wayixia.com");
  if(pa.test(location.host)) {
    alert('亲，您已经在挖一下网站了!');
    return;
  }

  window.undefined = window.undefined;

  // check the name is used
  if(window.Q) {
    //alert('conflict name for Q');
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

  //! LoadCompleted
  var _LoadCompleted = false;
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
  this.LBUTTON = 1;
  this.RBUTTON = 2;
  this.MBUTTON = 4;

  // debug
  this._DEBUG = {
    enable: false,  // 开启debug功能
    stdoutput: null // 输出
  };

  //! get Element from dom cache if exists
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
    return { width : w, height : h,	left : l,	top : t	};
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

    //! Javascript Loader
  function loadJsLib(arr) { 
    var scripts = document.getElementsByTagName("script");  
    // 判断指定的文件是否已经包含，如果已包含则触发onsuccess事件并返回  
    var libscript = null;
    for (i = 0; i < scripts.length; i++) {
      if(scripts[i].src) {
        
        var pos = -1;
        if((pos=scripts[i].src.indexOf('/wayixia.js')) >= 0) {
          _libdir = scripts[i].src.substring(0, pos) + '/qlib';
          libscript = scripts[i];
        }
      }
    }

    libs = libs || [];
    //! 解析script import
    var sImports = libscript.innerHTML;		
    var re = /\n/ig;
    var arr = libs.concat(sImports.split(re) || []);
    //alert(arr);
    // 同步加载
    loadscript(document.getElementsByTagName("head")[0], arr);

    // 顺序加载js文件
    function loadscript(header, ar) {
      ar = ar||[];
      if(ar.length<=0) { 
        _LoadCompleted = true;
        Q.DelayLoad();
        return;
      }
      //! 加载lib
      var url = ar.shift();
      //! 解析格式，并自动加载库文件
      var re2 = /^\s*import\s+(.+);/i;
      if(re2.test(url)) {
        url = RegExp.$1 + '';
        url = url.replace(/\./g, '/')+'.js?'+Math.floor(+new Date/1E7);
        // 创建script结点,并将其属性设为外联JavaScript文件  
        var s = document.createElement("script");  
        s.type = "text/javascript";
        s.src = _libdir+'/'+url;
        // alert(s.src);
        // 对于IE浏览器，使用readystatechange事件判断是否载入成功  
        // 对于其他浏览器，使用onload事件判断载入是否成功  
        s.done = false;
        s.onload = s.onreadystatechange = (function() {
          if ( !this.done 
             && (!this.readyState 
              || this.readyState == "loaded" 
              || this.readyState == "complete") 
          ) {
            this.done = true;						
            loadscript(header, ar);

            // Handle memory leak in IE
            this.onload = this.onreadystatechange = null;
            header.removeChild( this );
          }
        });
        s.onerror = (function() { 
          // Handle memory leak in IE
          this.onload = this.onreadystatechange = null;
          header.removeChild(this); 
          loadscript(header, ar);
        });
        
        // 获取head结点，并将<script>插入到其中  
        header.appendChild(s);
            } else {
        loadscript(header, ar);
      }
    }
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

	this.registerDelayDOMReady = function(f) {
		if(!_LoadCompleted) {
			_delayDOMReady.push(f);
		}
	};

	this.DelayLoad = function() {
		if(_LoadCompleted) {
			while(_delayDOMReady.length > 0) { _delayDOMReady.shift()(); }
		}
	};
	//! OnLoad
    this.DOMReady = function(evt) {
		if(!_LoadCompleted) {
			Q.registerDelayDOMReady(Q.delayDOMReady);
		} else {
			Q.delayDOMReady();
		}        
    };
	// 当所有脚本都加载后开始执行Ready回调
	this.delayDOMReady = function() {
		while(_OnPageLoad.length > 0) { _OnPageLoad.shift()(); }
	};

	//! push event when document loaded
    this.Ready = function(f) { _OnPageLoad.push(f); };

	// current Q.js所在路径
	Q.__DIR__ = function() {
		//var js=document.scripts;
		//js=js[js.length-1].src.substring(0,js[js.length-1].src.lastIndexOf("/")+1);
		//return js;
		return _libdir;
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
				function(){	return this.textContent;	}
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
			Q.LBUTTON	= 0;
			Q.MBUTTON	= 1;
		}
		doParseUrlQuery();
		Q.Ready(initf);
		Q.registerDelayDOMReady(Q.delayDOMReady);
		loadJsLib();
	}	
	// initialize
	Initialize();
})(['import utils.json2;', 'import utils.ajax;', 'import thirdparty.easyXDM-2-4-17-1.easyXDM-min;'], 

(
function(){
	var _this = this;
	var _xdm = null;
  var _login_user = false;
	var wayixia_iframes = [];
	var wayixia_top_height = 38;
	var rpc_iframe = null;
	var wayixia_overlay = null;
	var wayixia_container = null;

	var wayixia_title_bar = null;
	var wayixia_pic_canvas = null;
	var wayixia_pic_list = null;
	var wayixia_images_loading = 0;
	//  style="height: auto; width: auto; left: 0px;"
	// 	<img class="share_sina simple_tool" src="../img/sina.png" title="分享到新浪微博" style="display: none;"> \
	// 	<img class="open_link simple_tool" src="../img/link.png" title="新窗口打开图片" style="display: none;"> \
	/*
	var  wayixia_pic_template = '<div class="wayixia_box"> \
		<span class="wayixia_info"> \
			<span class="wh">[[width]]x[[height]]<span> </span>\
		</span></span> \
		<div class="wayixia_image"> \
			<a href="javascript:;"> \
			<img style="margin-top: [[margintop]]px;width:[[sizewidth]]px;height:[[sizeheight]]px;" src="[[imgsrc]]" alt="Wa This" class="image"> \
			<strong class="qwa" title="" style="display: none;"></strong> \
			<strong class="wa" title="" style="display: none;"></strong> \
			</a> \
		</div> \
  </div>';

  */

  //function add(item) {
  //	return wayixia_pic_template.replace(/\[\[(\w+)\]\]/ig, 
  //		function(w,w2,w3,w4) { return item[w2];	}
  //	);
  //}

  if(!document['__wayixia']) {
    document['__wayixia'] = _this;
  }

  function alpha() {
    var _self = this;
    this.data = [];
    this.play = function() {
      if(_self.data.length == 0) 
         return;
      e = _self.data[0];
      var op = parseFloat(e.style.opacity, 10);
      op = op - 0.1;
      if(op >= 0.1) {
        e.style.opacity = op;
      } else {
        e.className = 'wing_box';
        _self.data.shift();
      }
      setTimeout(function() { _self.play();}, 40);
    }

    this.push = function(e) {
      if(e) {
        e.style.opacity = 1.0;
        _self.data.push(e);
      }
    }

      this.completed = function() {return _self.data.length == 0; };
  }

  Q.Ready(function(){
    _xdm = new easyXDM.Rpc({
      swf: Q.__DIR__()+"/thirdparty/easyXDM-2-4-17-1/easyxdm.swf",
      remote: "http://wayixia.com/?app=wayixia&mod=api&action=xdm",
      remoteHelper: Q.__DIR__()+"/thirdparty/easyXDM-2-4-17-1/name.html",
      onReady: function() {
        check_login();
      },
    },
    {
      remote: {
        request: {}
      }
    })
  })

  function check_login() {
    _xdm.request(
      {
        command: "http://wayixia.com/?app=wayixia&mod=user&action=do-check-login&inajax=true",
        data: {},
      },

      function(response) {
        //alert(Q.json_encode(response));
        var resp = Q.json_decode(response.response);
        _login_user = (resp.data == 1);
      },
          
      function() {}
    );
  }

  function check_login_dialog() {
    if(!_login_user) {
      // must login
      var wnd = _this.open_window(
          "http://wayixia.com/index.php?app=wayixia&mod=user&action=login&logintype=close", 
          {width:580, height:250}
      );

      var timer = setInterval( function() {
            try {
              if(wnd.closed) {
                clearInterval(timer);
                check_login();
              }
            } catch(e) {}
          }, 
      1000);
    }

    return _login_user;
  }

  _this.open_window = function(uri, json) {	
    var rc = {
      align: "center",
      left	: 300,
      top		: 200,
      width	: 700,
      height	: 500,
      scrollbars : "yes",
      resizable : "yes",
      statebar : "no"
    };

    if(json) {
      if(typeof json.width != "undefined") {
        rc["width"] = json.width;
      }
      
      if(typeof json.height != "undefined") {
        rc["height"] = json.height;
      }
      
      if(typeof json.left != "undefined") {
        rc["left"] = json.left;
      }
      
      if(typeof json.top != "undefined") {
        rc["top"] = json.top;
      }
      
      if(typeof json.scrollbars != "undefined") {
        rc["scrollbars"] = json.scrollbars;
      }
      
      if(typeof json.resizable != "undefined") {
        rc["resizable"] = json.resizable;
      }
      
      if(typeof json.scrollbars != "undefined") {
        rc["statebar"] = json.statebar;
      }
      
      if(typeof json.align == "center") {
        var _left = (screen.width - rc["width"])/2;
        var _top  = (screen.height - rc["height"])/2;
        rc["left"] = 0 + _left + 'px';
        rc["top"]  = 0 + _top + 'px';
      }
    }
    
    var wndcfg = []; 
    
    for(var name in rc) {
      wndcfg.push(name + "=" + rc[name]);
    }
    
    return window.open(uri, "poptempWin", wndcfg.join(","));
  }

  var _state_message = {
    ing: '正在努力地挖...',
    ok : '成功挖到了此图!',
    error: '挖一下，失败!',
    warn: '已经挖过了哦!',
  }

  // state: 
  _this.set_image_state = function(e, state) {
    if(!_state_message[state]) {
      state = 'ing';
    }
    e.className = 'wing_box wing_box_'+state;
    e.state = state;
    e.innerHTML = _state_message[state];
    if(state != 'ing') {
      var _alpha_object = new alpha();
      _alpha_object.push(e);
      setTimeout(function() {_alpha_object.play();}, 5000);
    }
  }

  _this.get_image_state = function(e) {
    var state = e.state || '';
    return state;
  }

  _this.createElement = function(config) {
    var box = document.createElement('DIV');
    wayixia_container.appendChild(box);
    box.className = 'wayixia_box';
    box.innerHTML = '<span class="wayixia_info"> \
      <span class="wh">'+config.width+'x'+config.height+'<span> </span> \
      </span></span>';

    var img = document.createElement('div');
    box.appendChild(img);
    var a = document.createElement('a');
    img.appendChild(a);
    var inner_img = document.createElement('img');
    var strong_1 = document.createElement('strong');
    var strong_2 = document.createElement('strong');
    a.appendChild(inner_img);
    a.appendChild(strong_1);
    a.appendChild(strong_2);

    img.className = 'wayixia_image';
    a.href='javscript:void(0);';
    inner_img.src=config.imgsrc;
    inner_img.className = 'image';
    inner_img.style.cssText = 'margin-top:'+config.margintop+'px;width:'+config.sizewidth+'px;height:'+config.sizeheight+'px;'
    
    strong_1.className = 'qwa';
    strong_1.style.display = 'none';
    strong_2.className = 'wa';
    strong_2.style.display = 'none';

    // wing_box
    var wing_box = document.createElement('DIV');
    box.appendChild(wing_box);
    wing_box.className = 'wing_box';

    box.onmouseover = function() {
      strong_1.style.display = 'block';
      strong_2.style.display = 'block';  
    }

    box.onmouseout = function() {
      strong_1.style.display = 'none';
      strong_2.style.display = 'none';
    }

    strong_1.onclick = function() {
      if(!check_login_dialog()) 
        return;
      //quick wa
      //_this.open_image_window(inner_img.src);
      var json_data = {};
      json_data.pageUrl = location.href;
      json_data.srcUrl = inner_img.src, 
      json_data.cookie = document.cookie,
      json_data.title = document.title,
      json_data.width = config.width;
      json_data.height = config.height;
      json_data.albumid = 0;
      _this.set_image_state(wing_box, 'ing');
      _xdm&&_xdm.request&&_xdm.request(
        {
          command:"http://wayixia.com/index.php?app=wayixia&mod=api&action=wa&inajax=true",
          data: {img: json_data},
          noCache:true,
          method:"post"
        },

        function(response){
          //wing_box.style.display = 'none';
          var resp = Q.json_decode(response.response);
          if(resp) {
            var result = resp.header;
            if(result == 0) {
              _this.set_image_state(wing_box, 'ok');
              //alert('恭喜您，成功挖到了您想要的图片!');
            } else if(result == -2) {
              _login_user = false;
              check_login_dialog();
              return;
            } else if(result == -100){
              _this.set_image_state(wing_box, 'warn');
              //alert('哎呀，挖一下，失败了!('+resp.data+')')
            } else if(result == -101) {
			  _this.set_image_state(wing_box, 'error');
			  alert('哎呀，挖一下，失败了!('+resp.data+')')
			}
          } else {
            _this.set_image_state(wing_box, 'error');
            //alert('哎呀，挖一下，失败了!('+resp.data+')')
          }
        }, // ok

        function(){
          _this.set_image_state(wing_box, 'error');
        }  // error
      );
    }

    strong_2.onclick = function() { 
      if(!check_login_dialog()) 
        return;
	  _this.deactive();
      _this.open_image_window(inner_img.src);
    }
  }

  _this.open_image_window = function(img_src) {
    var url = 'http://wayixia.com/?mod=api&action=preview';
    url += '&r='+encodeURIComponent(location.href);
    url += '&c='+encodeURIComponent(document.cookie);
    url += '&t='+encodeURIComponent(document.title);
    url += '&i='+encodeURIComponent(img_src);
    
    _this.open_window(url, {height:355}); 
  }

  _this.deactive = function() {
    if(wayixia_overlay) {
      wayixia_overlay.parentNode.removeChild(wayixia_overlay)
      wayixia_overlay = null;
    }
    if(wayixia_container) {
      wayixia_container.parentNode.removeChild(wayixia_container)
      wayixia_container = null;
      wayixia_title_bar = null;
      wayixia_pic_canvas = null;
    }
  }

  /**
   * Returns a function which will handle displaying information about the
   * image once the image has finished loading.
   */
  function getImageInfoHandler() {
    return function() {
      wayixia_images_loading--;
      var img = this;
      if(	img.width > 100 && (img.height > 100)) {
        var img_width = img.width;
        var img_height = img.height;
        var max_width = 200;
        var max_height = 200;
        var result = max_width * img_height - max_height * img_width;
        var width = 0;
        var height = 0;
        if(result<0) {
          //img.width = max_width;  // 宽度
          width  = max_width;
          height = (max_width*img_height)/(img_width*1.0);
        } else {
          //img.height = max_height;
          height = max_height;
          width  = (img_width*height)/(img_height*1.0);
        }
        var item = {
          'imgsrc': img.src,
          'width': img_width,
          'height': img_height,
          'sizewidth':width,
          'sizeheight':height,
          'margintop': ((max_height-height)/2)
        };
        _this.createElement(item);
      }
    };
  };

	function enum_pictures() {
		var len = document.images.length;
		var output = '';
		var accept_images = {};
		for(var i=0; i < len ; i++) {
			if(document.images[i].src=='' 
				|| accept_images[document.images[i].src]) 
			{
			  continue;
			}
			wayixia_images_loading++;
			var img = new Image();
			img.onerror=function() { 
			  wayixia_images_loading--;
			  return true;
			}

			img.onload=getImageInfoHandler();
			img.src=document.images[i].src;
		}
	}

  _this.displayValidImages = function() {
    // alert('displayValidImages called test');
    var need_load_image = !wayixia_container;

    if(!wayixia_overlay) {
      wayixia_overlay = document.createElement('div');
      wayixia_overlay.style.cssText = 'position:fixed; left:0;top:0;right:0;bottom:0;background:#F2F2F2;z-index:999999999999990;opacity:.95;';
      document.body.appendChild(wayixia_overlay);
    }

    if(!wayixia_container) {
      wayixia_container = document.createElement('div');
      wayixia_container.id="wayixia_container";
      document.body.appendChild(wayixia_container);
    }

    if(!wayixia_title_bar) {
      wayixia_title_bar = document.createElement('div');
      wayixia_title_bar.style.cssText = 'position:fixed; left:0;top:0;right:0; height:'+wayixia_top_height+'px;line-height:'+wayixia_top_height+'px; background:#2d2d2d;z-index:999999999999991;color:#FFF;text-indent: 10px;cursor:default;opacity: 0.89;text-align:left;font-size:12px;font-family:arial;';
      wayixia_container.appendChild(wayixia_title_bar);
      //wayixia_title_bar.style.WebkitBoxShadow = "5px 5px 20px rgba(0,0,0,0.5)";
      wayixia_title_bar.onmouseover=function() { this.style.background='#FF9900';}
      wayixia_title_bar.onmouseout=function() { this.style.background='#2d2d2d';}
      wayixia_title_bar.onmousedown=function() { this.style.background='#FF6600';}
      wayixia_title_bar.onclick=function(){ _this.deactive();	}
      wayixia_title_bar.innerHTML = '[X] 点击色条可以退出哦!<div class="cache_image_1"></div>'
    }

    if(!wayixia_pic_canvas) {
      wayixia_pic_canvas = document.createElement('div');
      wayixia_pic_canvas.style.cssText = 'top:'+wayixia_top_height+'px; background:#FFF; z-index:9999999999999991;color:#FFF;cursor:default;overflow:auto;';
      wayixia_container.appendChild(wayixia_pic_canvas);
    }

    if(need_load_image) {
      wayixia_images_loading = 0;
      enum_pictures();
    }
    
    document.body.scrollTop = 0;
  }

  // 动态加载css
  var head = document.getElementsByTagName('HEAD').item(0);
  var style = document.createElement('link');
  style.href = 'http://wayixia.com/applications/wayixia/themes/default/plugin_wayixia.css';
  style.rel = 'stylesheet';
  style.type = 'text/css';
  head.appendChild(style);
  _this.displayValidImages();

})

); // Q()
