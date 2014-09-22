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
