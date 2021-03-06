/*-------------------------------------------------------
  UI library Complete Control __comboboxL
  function: UI界面组件库管理器
  date: 2008-06-12
  author: lovelylife
  usage: 
  1. could not create other object like as 'Tab'
  2. include this javascript document
  3. invoke Tab._push method in asc order, Tab._shift method in desc order
  4. bind event button by Tab._bind method
---------------------------------------------------------*/



var COMBOBOX_ALL = 0x00;			// 默认模式
var COMBOBOX_INPUT = 0x01;			// 输入模式
var COMBOBOX_SELECT = 0x02;			// 下拉模式
var COMBOBOX_AUTOCOMPLETE = 0x04;	// 自动完成

// 下拉选项结构 
// text  - 显示的文本
// value - 值
function itemOption(text, value) { 
	var _this 		= this;
	this.text		= text;
	this.value		= value;
	this.toString	= function() { return _this.text; };
	this.valueOf	= function()  { return _this.value; };
}

var __comboboxL = __CLASS.create();
__comboboxL.prototype = {
	// attributes
	name : null,		// 该控件名称
	text : '',			// 输入窗口中的文本数据
	items : null,			// 下拉窗口列表全部数据
	itemsBuffer : null,	// 下拉窗口中和输入数据相匹配的列表数据
	selected : -1,		// 当前选中项
	IsFocus : false,	// 输入窗口是否激活状态
	
	// panel controls
	tabwnd : null,
	hwnd : null,
	editWnd : null,
	arrowWnd: null,
	popDropWnd : null,
	_initialize : function(parentWnd, name, cstyle, width, height){
		var _this  = this;
	    // 注册该组件并可以用UI.component['name']的形式来访问
	    if( name != '') {
	        if(UI.registerComponent(name, this)) {
			    alert(name + " register error! ");
			    return;
		    }
		    this.name = name;
	    }
	    
	    // 构造控件界面
		_this.hwnd = $CreateHTMLObject('TABLE');
		var row = _this.hwnd.insertRow();
		var cell1 = row.insertCell();
		var cell2 = row.insertCell();
		_this.editWnd = $CreateHTMLObject('INPUT');
		_this.arrowWnd = $CreateHTMLObject('button');
		_this.dropWnd = $CreateHTMLObject('DIV');
		_this.popDropWnd = createPopup();
		cell1.appendChild(_this.editWnd);
		cell2.appendChild(_this.arrowWnd);
		parentWnd.appendChild(_this.hwnd);
		document.body.appendChild(_this.dropWnd);
		
		_this.popDropWnd.document.body.style.border = '1px outset #CCC';		
		_this.hwnd.border = 0;
		_this.hwnd.cellPadding = 0;
		_this.hwnd.cellSpacing = 1;
		_this.hwnd.style.background = '#CCC';

		cell1.bgColor = 'white';
		cell2.style.width = 18;
		cell2.bgColor = 'white';
		cell2.align = 'center';
		
		// arrowWnd
		_this.arrowWnd.innerHTML = '<font face="Webdings">6</font>';
		_this.arrowWnd.style.cssText = 'cursor: default; border-width: 0px; margin: 0px; padding: 0px; font-size: 11px; background: white;';		
		_this.arrowWnd.onclick = function() {
			_this.dropWindow(!_this.popDropWnd.isOpen);
			_this.autoComplete();
			//_this.editWnd.focus();
			
		};
		_this.arrowWnd.onmouseover = function() {};

		// 设置显示样式
		_this.hwnd.style.cssText = 'width: '+width+';';
		_this.hwnd.onmouseover = function() { 
			this.style.background = '#648BC6'; 
		};
		_this.hwnd.onmouseout = function() { 
			if(!_this.IsFocus) { 
				this.style.background = '#CCC'; 
			}
		};
		
		// 编辑窗口
		_this.editWnd.style.cssText = 'width: 100%; border: 0px solid red;; margin: 0;'
		_this.editWnd.attachEvent('onkeyup',function(){
			if( event.keyCode != 13) 
				_this.autoComplete();
			if( event.keyCode == 38) {	// up key
				_this.up();
			} else if( event.keyCode == 40 ) {	// down key
				_this.down();
			} else if( event.keyCode == 13 ) {
				_this.msgbox('this.selected :' + _this.selected)
				if( _this.selected > -1 ) {
					if( _this.selected >= _this.itemsBuffer.length)
						return;
					_this.popDropWnd.document.body.childNodes[_this.selected].click();
					_this.selected = -1;
				} else {
					_this.setAutoWndText(_this.editWnd.value);
					_this.dropWindow(false);
				}
			}
		});
		
		_this.editWnd.onfocus = function() { 
			_this.IsFocus = true;
			_this.hwnd.style.background = '#648BC6';
		};
		
		_this.editWnd.onblur = function() {
			_this.IsFocus = false; 
			_this.hwnd.style.background = '#CCC';
		}
		
		// 初始化数据
		_this.items = new Array;
		_this.itemsBuffer = new Array;
	},
	
	//追加记录
	push: function(text, value, isRe) {
		var _this = this;		
		if( isRe ) {	// 是否强制添加重复数据项
			
		} else {
			if(_this.findText(text, true)) {
				return;
			}
		}
		_this.items.push(new itemOption(text, value));
	},
	
	findText : function(text, isGlobal) {
		var t = (isGlobal) ? this.items : this.itemsBuffer;
		var len = t.length;
		for(var i=0; i < len; i++) {
			if(text == t[i].toString());	
		}	
	},
	
	findValue : function(value, isGlobal) {
		var t = (isGlobal) ? this.items : this.itemsBuffer;
		var len = t.length;
		for(var i=0; i < len; i++) {
			if(value == t[i].valueOf());	
		}
	},
	
	clear : function() {
		// clear memory
		this.items = [];
	},
	
	setWndText : function(text) {
		this.text = text;
		this.updateData();
	},
	
	getItem : function() {
		
	},
	
	setAutoWndText : function(text) {
		this.items.sort();
		var isnull = true;
		var re = new RegExp('^'+text+'.+?', 'ig');
		for( var i=0; i < this.items.length; i++ ) {
			if( re.test(this.items[i].toString()) ) {
				this.setWndText(this.items[i]);
				return;
				isnull = false;
			}
		}
		if( isnull ) {
			this.setWndText('');
		}
	},
	
	setWidth : function(width) {
		var b = width.indexOf('%') != -1;
		width = parseInt(width.replace(/%/ig, ''), 10);
		if(isNaN(width)) {
			alert('error');
			return;
		}
		this.tabhwnd.style.width = width + (b?'%':'');
		this.editWnd.style.width = (width - this.arrowWnd.offsetWidth - 4) + (b?'%':'');
	},
	
	getItemText : function() {
		
	},
	
	updateData : function() {
		if( this.hwnd != null ) {
			this.editWnd.innerText = this.text;
		}
	},
	
	updateDropWnd : function() {
		var _this = this;
		this.itemsBuffer.sort();
		this.popDropWnd.document.body.innerHTML = '';
		for( var i=0; i < this.itemsBuffer.length; i++ ) {
			var li = this.popDropWnd.document.createElement('li');
			this.popDropWnd.document.body.appendChild(li);
			li.href = 'javascript: void(0);'
			li.innerText = this.itemsBuffer[i].text;
			li.onmouseover = function() {
				_this.selected =  _this.findItem(this);
				if( (this.offsetTop + this.offsetHeight) > _this.maxHeight ) {
					_this.dropWnd.scrollTop =  (_this.selected - 1) * this.offsetHeight;
				} else if(this.offsetTop < _this.dropWnd.scrollTop ){
					_this.dropWnd.scrollTop = _this.selected * this.offsetHeight;
				}
				this.style.cssText = 'background: blue; color: white;';
				
			};
			li.onmouseout = function() {
				this.style.cssText = 'background: white; color: #000;';
			}
			li.onclick = function(){ _this.setWndText(this.innerText);_this.dropWindow(false);}
			li.onmouseup = function(){_this.setWndText(this.innerText);_this.dropWindow(false);}
		}
	},
	
	dropWindow : function(isDrop) {
		if( !isDrop) {
			this.popDropWnd.hide();
		} else {
			this.updateDropWnd();
			var height = this.itemsBuffer.length * 18;
			if( height == 0 ) height = 100;
			this.popDropWnd.show(0, this.hwnd.offsetHeight, this.hwnd.offsetWidth, height, this.hwnd);
		}
	},
	
	findItem : function(node) {
		var childNodes = this.dropWnd.childNodes;
		if( childNodes.length < 1 )
			return -1;
		for( var i=0; i < childNodes.length; i++ ) {
			if( childNodes[i] == node )
				return i;		
		}
		return -1;
	},
	
	itemClick : function(lpfunc) {
		
	},
	
	autoComplete : function() {
		var text = this.editWnd.value;
		var count = 0;
		this.itemsBuffer = [];
		var len = this.items.length;
		var tlen = (text == '')?0:text.toString().length;
		var bAdd = false;
		for( var i=0; i < len ; i++ ) {
			if( tlen == 0 ) {
				bAdd = true;
			} else {
				if(this.items[i].toString().substr(0, tlen) == text) {
					bAdd = true;	
				}
			}
			
			if( bAdd ) {
				this.itemsBuffer.push(this.items[i]);
				count = count + 1;
				bAdd = false;
			}
		}
		if( count > 0 ) {
			this.dropWindow(true);
		} else {
			this.dropWindow(false);
		}
	},
	
	down : function() {
		// doNext;
		var dropWnd = this.popDropWnd.document.body;
		if(dropWnd.childNodes.length < 1) {
		    this.msgbox("no item", "green");
		    return;
		}
		this.msgbox("doNext start-----------------------------------");
		var node = null;
		var pos = -1;
		this.msgbox("init status: this.selected :" + this.selected )
		if( this.selected <= -1 ) {
			this.msgbox("this selected is null ");
			pos = 0;
		} else {
		    this.msgbox("this.selected:  - " + this.selected );
		    pos = this.mod((this.selected + 1), this.itemsBuffer.length);
		}
		node = dropWnd.childNodes[pos];
		if( node != null ) {
		    this.msgbox("node: " + node.innerText);
			node.fireEvent('onmouseover');
			this.selected = pos;
		} else {
		    this.msgbox("node is null")
		}
		//this.msgbox("this.selected: " + this.selected.innerText);
		this.msgbox("doNext end--------------------------------------<br><br>");
	},
	
	up : function(){
		// do preview
		var dropWnd = this.popDropWnd.document.body;
		if(dropWnd.childNodes.length < 1) {
		    this.msgbox("no item", "green");
		    return;
		}
		this.msgbox("doNext start-----------------------------------");
		var node = null;
		var pos = -1;
		this.msgbox("init status: this.selected :" + this.selected )
		if( this.selected <= -1 ) {
			pos = this.mod(-1, this.itemsBuffer.length);
		} else {
		    pos = this.mod((this.selected - 1), this.itemsBuffer.length);
		}
		node = dropWnd.childNodes[pos];
		if( node != null ) {
			node.fireEvent('onmouseover');
			this.selected = this.mod(pos, this.itemsBuffer.length );
		} else {
		    this.msgbox("node is null")
		}
		//this.msgbox("this.selected: " + this.selected.innerText);
		this.msgbox("doNext end--------------------------------------<br><br>");	},
	
	msgbox : function(str, color) {
	    /* if(color)
	        prop.innerHTML += "<br><font color='" + color + "'>" + str + "</font>";
	    else
	        prop.innerHTML += "<br>" + str;  */
	    
	},
	
	mod : function(num, modern) {
		var r = (num % modern);
		return ((r >= 0)? r:(r+modern));
	}
};