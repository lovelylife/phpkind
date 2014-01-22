/*------------------------------------------------------------------------------------
 $ class jtable component
 $ date: 2009-2-6 16:31
 $ author: LovelyLife http://onlyaa.com
 
 $ bugs Fixed:
 2009-06-10 16:18:40 [LovelyLife]:
   增加拖动变换列 
 2009-10-21 11:10:22 [LovelyLife]:
   jtable:initview函数中的document.body.appendChild在ie8中不兼容，改成
  window.onload消息队列中处理
  
 2009-10-26 10:51:33 [LovelyLife]:
   修改了row_disabled功能，如果存在checkbox，则禁用checkbox
   
---------------------------------------------------------------------------------------*/


// 当有true返回是，说明结束循环
Array.prototype.each = function(callback) {
  var len = this.length;
  if(typeof callback != 'function') {
    alert('not a function');
    return;
  }
  for(var i=0; i < len; i++) {
    if(callback(this[i], i)) {  break; }
  }
};

// handle event listen
var BindHandler = function(object, func) {
  return function() {
    return func.apply(object, arguments);
  };
};
 
var BindAsEventHandler = function(object, func) {
  return function(event) {
    return func.call(object, (event || window.event));
  };
};
 
var CurrentStyle = function(element){
  return element.currentStyle || document.defaultView.getComputedStyle(element, null);
};

// create the Data Store
var jstore = Q.KLASS();
jstore.prototype = {
  records : null,  // 记录集
  proxy : null,
  currentpage : -1,
  length : 0,
  _initialize : function(json) {
    var _this = this;
    _this.records = new STRUCT_HASMAP;
    if(!json) {  return;  }
    _this.remote = json.remote || false;
    if(json.datasource)
      _this.load_json(json.datasource);
  
    if(json.proxy) { 
      _this.proxy = json.proxy; 
      _this.load_remote(0, 30, null);
    }
  },
  
  load_json : function(jsonsrouce, bClearOldData) {
    var _this = this;
    if(!!bClearOldData) {
      _this.records = new STRUCT_HASMAP;
      _this.length = 0;
    }
    
    jsonsrouce.each(function(record, index) {
        record["dataIndex"] = _this.records.dataIndex; // 存储数据索引， 用于确定改记录在记录集中的位置
        _this.records.push(record);
    });
    // _this.length = _this.records.length;
  },
  
  load_remote : function(page, pagesize, callback) {
    var _this = this;
    Q.Ajax({
      command: _this.proxy+'&page='+page+'&size='+pagesize,
      oncomplete : function(xmlhttp) {
        //alert(xmlhttp.responseText);
        var s = eval('(' + xmlhttp.responseText + ')');
        _this.load_json(s.data);
        _this.length = s.extra;
        
        if(typeof callback == 'function') {
          callback(_this.records);
        }
      }
    });
  },
  
  load_page : function(page, pagesize, callback) {
    var fnCallback = callback || function(arr) {};
    var _this = this;
    
    if(_this.proxy) {
      // alert('remote');
      _this.load_remote(page, pagesize, fnCallback);
      
    } else {
      var pagedata = new STRUCT_HASMAP;
      for(var i=(page-1) * pagesize; i < (page * pagesize); i++) {
        if(i >= _this.records.length) { break; }
        pagedata.push(_this.records.item(i));
      }
      fnCallback(pagedata);
    }
  },
  
  push : function(record) {
    var _this = this;
    record["dataIndex"] = _this.records.dataIndex; // 存储数据索引， 用于确定改记录在记录集中的位置
    _this.records.push(record);
    _this.length++;
  },
  
  remove : function(record) {
    var _this = this;
    var key = _this.records.find(record);
    _this.records.remove(key);
    _this.length--;
  },

  //! 渲染数据接口
  render : function(fnHanlder) {
    if(fnHanlder) {
      this.records.each(fnHanlder);
    }
  },
  
  getRecord : function(dataIndex) {
    if(!this.records[dataIndex]) {
      return null;
    }
    return this.records[dataIndex];
  }
};

var __TH = Q.KLASS();
__TH.prototype = {
  hwnd : null,
  hwnd_moveline : null,
  _width : 0,
  _fMove : null,
  _fStop : null,
  _isResizable : false,
  _isDragable  : false,
  _left : 0,
  _right: 0,
  _dx : 5,
  
  _initialize : function(TD, options) {
    options = options || {};
    this.onMove  = options.onMove  || function(oEvent, hander){};
    this.onStart = options.onStart || function(oEvent, hander){};
    this.onStop  = options.onStop  || function(oEvent, hander){};

    this.hwnd = TD;
    this._width = TD.offsetWidth;
    
    // moving line;
    this.hwnd_moveline = options.moveline;
    this.hwnd_moveline.style.display = 'none';
    
    //事件对象(用于绑定移除事件)
    this._fMove = BindAsEventHandler(this, this.Move);
    this._fStop = BindAsEventHandler(this, this.Stop);
    Q.addEvent(this.hwnd, "mousedown", BindAsEventHandler(this, this.Start));
    Q.addEvent(this.hwnd, "mousemove", BindAsEventHandler(this, this.Move));
  },
  
  Start : function(oEvent) {
    var pos = Q.absPosition(this.hwnd);
    
    if(this.hwnd.style.cursor) {
      this._isResizable = true;
      this._dx = pos.left + pos.width - oEvent.clientX;
      // 显示和定位法线
      this.hwnd_moveline.style.display = '';
      this.hwnd_moveline.style.left = (oEvent.clientX) + 'px';
      this.hwnd_moveline.style.top = (pos.top) + 'px';
      //this.div_moveline.style.height = (this.hwnd.offsetHeight - 1 - this.hwnd_title.offsetHeight) + 'px';
    }
    
    //mousemove时移动 mouseup时停止
    Q.addEvent(document, "mousemove", this._fMove);
    Q.addEvent(document, "mouseup", this._fStop);
    if(document.all){
      //焦点丢失
      Q.addEvent(this.hwnd, "losecapture", this._fStop);
      //设置鼠标捕获
      this.hwnd.setCapture();
    }else{
      //焦点丢失
      Q.addEvent(window, "blur", this._fStop);
      //阻止默认动作
      oEvent.preventDefault();
    };

    // extend interface
    this.onStart(oEvent, this);
  },
  
  //拖动
  Move : function(oEvent) {
    //alert("mousemove")
    var scrollinfo = Q.scrollInfo();
    if(this._isDragable ) {
      // on drag 
    } else if(this._isResizable) {
      if( this._left > oEvent.clientX ) {
        this.hwnd_moveline.style.left = this._left + 'px';
        return;
      }
      this.hwnd_moveline.style.left = oEvent.clientX + 'px';
    } else {
      //__DEBUGER.print("_isDragable: "+this._isDragable);
      var pos = Q.absPosition(this.hwnd);
      this._left = pos.left;
      this._right = pos.left + pos.width;
      var x = oEvent.clientX - scrollinfo.l;
      if( (x <= (this._right+3)) && (x >= (this._right-5)) ) {  
        // 是否在右边框1像素的范围内
        this.hwnd.style.cursor = 'col-resize';
      } else {
        this.hwnd.style.cursor = '';
      }
    }
    
    // extend interface
    this.onMove(oEvent, this);
  },
    
  //停止拖动
  Stop : function(oEvent) {
    this.hwnd_moveline.style.display = "none";
    if(this._isResizable) {
      this._width = oEvent.clientX - this._left + this._dx;
      this.hwnd.firstChild.style.width = (this._width) + 'px';
    }
    
    if(this._isDragable) {}
    // extend interface
    this.onStop(oEvent, this);
    //移除事件
    Q.removeEvent(document, "mousemove", this._fMove);
    Q.removeEvent(document, "mouseup", this._fStop);
    if(document.all){
      Q.removeEvent(this.hwnd, "losecapture", this._fStop);
      this.hwnd.releaseCapture();
    }else{
      Q.removeEvent(window, "blur", this._fStop);
    }
    
    this._isResizable = false;
    this._isDragable  = false;
  }
};




// 0 是单选， 1 代表多选 2代表shift键按下时的多选
var SELECT_MODE_SINGLE  = 0;
var SELECT_MODE_CTRL  = 1;
var SELECT_MODE_SHIFT  = 2;

var jtable = Q.KLASS();
jtable.prototype = {

// 常量
STYLE : {
  WS_NONE      : 0x00000000,  // 最简洁样式
  WS_TITLEBAR    : 0x00000001,
  WS_TOOLBAR    : 0x00000002,
  WS_BORDER    : 0x00000004,

  WS_AUTOHEIGHT  : 0x00000008,  // 当主窗口的高度小于父窗口高度时，则父窗口自动高度，否则父窗口高度不变
  WS_100HEIGHT  : 0x00000010,
  WS_100WIDTH    : 0x00000020,
  WS_TITLE    : 0x00000040,
  WS_CHECKBOX    : 0x00000080,
  WS_MULTISELECT  : 0x00000100,  // 支持多选
  WS_PAGING    : 0x00000200,  // 分页样式
  WS_FITPARENT  : 0x00000400,  // 自动填满宽度
},

//
// 以"wnd"开头的变量都是HTML对象，是组成jtable控件的UI元素，
// jtable的组成机构如下图：
//
// |--------------------| __ wndTitle
// |--------------------| __ wndGroupHeader
// |--------------------|
// |          | __ wndFrame
// |  wndGroupBody  | 
// |          |
// |--------------------| __ wndToolbar
// |--------------------|
//


wndParent : null,
wnd : null,
wndTitleBar : null,
wndFrame : null,
wndGroupHeader : null,
wndGroupBody : null,
wndToolbar : null,
wndTableHeaderRow : null,
wndTableData : null,
wndMoveLine : null,

// 数据成员
wstyle : null,
columns: [],
evtListener : {},
jstore : null,

// 处理选中行
rows_selected : null,
rows_checked : null,


_initialize : function(json) {
  var _this = this;

  //样式解析
  _this.wstyle = _this.STYLE['WS_NONE'];
  _this._styleparse(json.wstyle);
  
  // 数据存储器
  _this.jstore = json.jstore;

  // 选中行的DOM元素
  _this.rows_selected = new STRUCT_HASMAP;

  // Checked 元素
  _this.rows_checked = new STRUCT_HASMAP;

  // 列
  _this.columns = [];

  if(_this.isCheckBoxStyle()) {
    _this.columns.push({name: '_check', 
      title: '<input type="checkbox">', 
      renderer : function(record) { return '<input type="checkbox">';},
      align: 'center',
      className : 'jtable_checkbox',
      issortable : false,
      fixedWidth : true,
      width: 40,
      isHTML: true
    });
  }
  {
    var arr = json.columns || [];
    for(var i=0; i < arr.length; i++) {
      _this.columns.push(arr[i]);
    }
  }
  
  // method overrides
  if(typeof json.row_onclick == 'function') {  _this.row_onclick = json.row_onclick; }
  if(typeof json.row_onclick == 'string') {
    try {
      _this.row_onclick = eval(json.row_onclick);
    } catch(e) {
      alert(e + '\n'+json.row_onclick);  
    }
  }
    
  if(typeof json.row_onmouseover == 'function') {  _this.row_onmouseover = json.row_onmouseover; }
  if(typeof json.row_onmouseover == 'string') {
    try {
      _this.row_onmouseover = eval(json.row_onmouseover);
    } catch(e) {
      alert(e + '\n'+json.row_onmouseover);  
    }
  }

  if(typeof json.row_onmouseout == 'function') {  _this.row_onmouseout = json.row_onmouseout; }
  if(typeof json.row_onmouseout == 'string') {
    try {
      _this.row_onmouseout = eval(json.row_onmouseout);
    } catch(e) {
      alert(e + '\n'+json.row_onmouseout);    
    }
  }
    
  if(typeof json.row_oninsert == 'function') {  _this.row_oninsert = json.row_oninsert; }
  if(typeof json.row_oninsert == 'string') {
    try {
      _this.row_oninsert = eval(json.row_oninsert);
    } catch(e) {
      alert(e + '\n'+json.row_oninsert);    
    }
  }

  // 初始化父窗口 wndParent,用来显示jtable控件
  // 并初始化jtable视图
  _this.wndParent = Q.$(json.container);
  if(_this.wndParent.nodeType && _this.wndParent.nodeType == Q.ELEMENT_NODE) {
    _this._initview();
  } else {
    alert('初始化界面出错，'+json.container+'不存在'); 
    return;
  }

  // 监听改变窗口大小事件，用户自适应父容器的宽度或者高度
  Q.addEvent(window, 'resize', 
    BindAsEventHandler(window, function() {
      if(_this.wndParent.style.width.indexOf('%') != -1 
      || _this.wndParent.style.height.indexOf('%') != -1) {
        _this.autosize();
      } 
    })
  );
  _this.render();
  _this.autosize();
},

// 创建jtable的框架，代码如下:
// <div class="jtable_hwnd">
//  <div class="jtable_titlebar"></div>
//  <div class="jtable_frame">
//    <div class="jtable_headtable_group">
//      <table cellpadding="0" cellspacing="0" border="0">
//      <tbody>
//        <tr>
//          <td><div class="jtable_title">column head</div></td>
//        </tr>
//      </tbody>
//      </table>
//    </div>
//    <div class="jtable_datatable_group">
//      <table cellpadding="0" cellspacing="0" border="0">
//      <tbody>
//        <tr dataindex="0"><td><div class="jtable_cdata">data</div></td></tr>
//      </tbody>
//      </table>
//    </div>
//  </div>
//  <div class="jtable_toolbar"></div>
// </div>
// 

//  初始化表格控件视图
_initview : function() {
  var _this = this;
  _this.wnd = document.createElement('DIV');
    _this.wndTitleBar = document.createElement('DIV');
    _this.wndFrame = document.createElement('DIV');
      _this.wndGroupHeader = document.createElement('DIV');
    _this.wndGroupBody = document.createElement('DIV');
    _this.wndToolbar = document.createElement('DIV');

  //!移动法线
  _this.wndMoveLine = document.createElement('DIV');
  document.body.appendChild(_this.wndMoveLine);

  //! 组合主框架
  _this.wnd.appendChild(_this.wndTitleBar);
  _this.wnd.appendChild(_this.wndFrame);
    _this.wndFrame.appendChild(_this.wndGroupHeader);
    _this.wndFrame.appendChild(_this.wndGroupBody);
  _this.wnd.appendChild(_this.wndToolbar);

  //! 设置UI样式
  _this.wnd.className = 'jtable_hwnd';
    _this.wndTitleBar.className = 'jtable_titlebar';
    _this.wndFrame.className = 'jtable_frame';
      _this.wndGroupHeader.className = 'jtable_group_header';
    _this.wndGroupBody.className = 'jtable_group_body';
    _this.wndToolbar.className = 'jtable_toolbar';
  _this.wndMoveLine.className = 'jtable_moveline';
  _this.wndMoveLine.style.display = 'none';
  
  // 在浏览器中渲染控件视图
  _this.wndParent.appendChild(_this.wnd);

  // 初始化表头表格和数据表格
  _this.wndGroupBody.innerHTML = 
    _this.wndGroupHeader.innerHTML = 
    '<table cellpadding="0" cellspacing="0" border="0"><tbody></tbody></table>';
  _this.wndTableHeaderRow = _this.wndGroupHeader.firstChild.insertRow(-1);
  _this.wndTableData = _this.wndGroupBody.firstChild;

  // 加载jtable的列
  _this.loadColumns();
  
  //加载checkbox样式，默认设置多选模式
  if(_this.isCheckBoxStyle()) {
    _this.wndTableHeaderRow.cells[0].childNodes[0].childNodes[0].childNodes[0].onclick = function() {
      _this.rows_selected_all(this.checked);
    };
  }

  // 添加事件
  _this.wndGroupHeader.onselectstart = function(evt) {return false;};
  _this.wndGroupBody.onscroll = function() { _this._sync_scroll(); };
  _this.wndGroupBody.onselectstart = function() { return false; };

  _this.updateView();  
},

// 更新控件视图
autosize : function() {
  var _this = this;
  var frame_width, frame_height;
  var fullHeight = parseInt(_this.wndParent.offsetHeight, 10);
  var fullWidth  = parseInt(_this.wndParent.offsetWidth, 10);
  var currentstyle = CurrentStyle(_this.wnd);
  //alert(currentstyle['borderTopWidth']);
    
  frame_height = fullHeight 
    - _this.wndTitleBar.offsetHeight 
    - _this.wndToolbar.offsetHeight
    - parseInt(currentstyle['borderTopWidth'],10)
    - parseInt(currentstyle['borderBottomWidth'],10);
  //alert(frame_height)
  _this.wndFrame.style.height = frame_height+'px';
  _this.wndGroupBody.style.height = (frame_height - _this.wndGroupHeader.offsetHeight)+'px';
  // alert(_this.wndGroupBody.scrollWidth);
  _this.wndGroupHeader.style.width = _this.wndGroupBody.scrollWidth + 'px';
},  

// 滚动条同步
_sync_scroll : function() {
  this.wndGroupHeader.style.left = (-this.wndGroupBody.scrollLeft) + 'px';
  this.sync_scroll();
},

// 解析样式 将形如"WS_X1 | WS_X2"字符串解析成STYLE['WS_X1']...
_styleparse : function(sStyle) {
  var _this = this;
  sStyle += '';
  var arr = sStyle.split(/\s*\|\s*/i);
  for(var i=0; i < arr.length; i++) {
    var s = _this.STYLE[arr[i]];
    if(s) {
      _this.wstyle += s;
    }
  }
},

setStyle : function(ws) {
  var _this = this;
  _this.updateView();
},

updateView : function() {
  var _this = this;
  var showTitleBar = _this.isStyle('WS_TITLEBAR') ? '':'none';
  _this.wndTitleBar.style.display = showTitleBar;

  var showToolBar = _this.isStyle('WS_TOOLBAR') ? '':'none';
  _this.wndToolbar.style.display = showToolBar;
},

isStyle : function(ws) {
  ws = this.STYLE[ws];
  if(!ws) { return false; }
  return ((this.wstyle & ws) == ws);
},

isCheckBoxStyle : function() {
  return this.isStyle('WS_CHECKBOX');
},

// 支持多选样式，可以同时选择多行
isMultiSelect : function() {
  return this.isCheckBoxStyle() || this.isStyle('WS_MULTISELECT');
},

append : function(nIndex, record) {
  var _this = this;  
  var ROW = _this.wndTableData.insertRow(-1);
  ROW.onmouseover = function() { return _this._rows_onmouseover(this); };
  ROW.onmouseout  = function() { return _this._rows_onmouseout(this);  };
  ROW.onclick     = function() { return _this._rows_onclick(this);  };
  // ROW.onmousedown = function() { if(!_this.rows_onmousedown(this)) {event.returnValue = false; return false}; }
  ROW.setAttribute('dataIndex', record['dataIndex']);  // 设置数据索引
  ROW.data = record;
  var len = _this.wndTableHeaderRow.cells.length;
  for(var j = 0; j < len; j++) {
    var TD = ROW.insertCell(-1);
    var theader = _this.wndTableHeaderRow.cells[j];
    var column = _this.columns[theader.getAttribute('_index')];
    var content = record[column.name];
    if(typeof column.renderer == 'function') {
      content = column.renderer(record);
    }
    
    var width = theader.firstChild.offsetWidth;
    var cell = _this._create_cell(ROW.rowIndex, j, { content : content,
      align : column.align,
      className: column.className,
      width : width,
      height : 30 ,
      isHTML : column.isHTML
    });
    TD.style.display = theader.style.display;
    TD.appendChild(cell);
  }

  if(_this.isCheckBoxStyle()) {
    _this.rows_checked.add(record['dataIndex'], ROW.cells[0].childNodes[0].childNodes[0]);
    ROW.cells[0].childNodes[0].childNodes[0].onclick=function(evt) {
      evt = evt || window.event;
      _this.row_set_selected(this.parentNode.parentNode.parentNode, this.checked);
      evt.cancelBubble = true;
    }
  }

  _this.row_oninsert(ROW, record);
},


_create_cell : function(nRow, nCol, json) {
  // 根据json对象创建多样化的TD单元格
  var _this = this;
  var DIV = document.createElement('DIV');
  DIV.className = 'jtable_cdata';
  if(json.className) {
    DIV.className += ' ' + json.className;
  }
  DIV.align = json.align;
  DIV.style.cssText = 'width:'+json.width + 'px; height:'+json.height + 'px;line-height: '+json.height+'px;';
  DIV.innerHTML = json.content;
  //if(json.isHTML)  DIV.innerHTML = json.content;
  //else DIV.innerText = json.content;
  _this._init_cell(DIV, nRow, nCol, json);
  return DIV;
},
  
loadData : function(datasrc, bClearOldData) {
  var _this = this;
  // 清楚选中数据
  _this.rows_selected.clear();
  if(_this.isCheckBoxStyle()) {
    _this.rows_checked.clear();
    _this.wndTableHeaderRow.cells[0].childNodes[0].childNodes[0].childNodes[0].checked = false;  
  }

  _this.jstore.load_json(datasrc, !!bClearOldData);
  if(!!bClearOldData) {
    _this.wndTableData.removeChild(_this.wndTableData.firstChild);
  }
},

render : function() {
  var _this = this;
  this.jstore.render(function(record, index) {
    _this.append(index, record);
  });
},

loadColumns : function() {
  var _this = this;
  for(var i=0; i < _this.columns.length; i++) {
    var column = _this.columns[i];
    column.width = parseInt(column.width, 10);
    if(typeof column.renderer == 'string') {
      column.renderer = eval(column.renderer);
    }
    _this.insertcolumn(i, column);
  }
},

insertcolumn : function(arrIndex, json) {
  var _this = this;
  var TD = _this.wndTableHeaderRow.insertCell(-1);
  
  json.isHidden = !!json.isHidden;
  TD.style.display = json.isHidden ? 'none' : '';
  TD.setAttribute('_index', arrIndex);
  TD.innerHTML = '<DIV align="'+json.align+'" class="jtable_column_header" style="width:'+json.width+'px;"><a HideFocus>'
          +json.title+'</a></DIV>';
  
  TD.firstChild.onclick = function() { _this._column_click(this.parentNode.cellIndex); };
  TD.firstChild.ondblclick = function() { _this._column_dblclick(this.parentNode.cellIndex);};

  //!固定宽度
  if(!json.fixedWidth) {
    new __TH(TD, {moveline: _this.wndMoveLine, 
      onStart: function(evt, handler) { 
        _this.column_MouseDown(evt, handler); 
      }, 
      onStop: function(evt, handler) { 
        _this.column_MouseUp(evt, handler); 
      }
    });
  }
},

setClickEvent : function(colIndex, clickEvent) {
  var _this = this;
  var column = _this.columns[colIndex];
  if(column) {
    if(!column.clicks) {
      column.clicks = [];
    }
    column.clicks.push(clickEvent);
  } else {
    alert('Invalid Column');
  }
},

// 排序函数原型 sortFunc(row1, row2) 
// 
setSortFunc: function(colIndex, sortFunc) {
  var _this = this;
  var column = _this.columns[colIndex];
  if(column) {
    column.sort = sortFunc;
  } else {
    alert('Invalid Column');
  }
},
  
column_MouseDown : function(evt, handler) {
  var _this = this;
  if(handler._isResizable) {
    _this.wndMoveLine.style.height = 
      (_this.wnd.offsetHeight - _this.wndTitleBar.offsetHeight) + 'px';
  }
},
  
column_MouseUp : function(evt, handler) {
  var _this = this;
  var TD = handler.hwnd;
  if(handler._isResizable) {
    var nCol = TD.cellIndex;
    _this.rows_each( function(row) { row.cells[nCol].childNodes[0].style.width = handler._width+'px'; });
    _this.autosize();
    _this._sync_scroll();
  }
},

//! 列表头单击事件
_column_click : function(nCol) {
  var column = this.columns[nCol];
  // alert(column.clicks);
  // 出示排序函数
  if(column.sort) {
    this.sortTable(nCol, true, column.sort);
  }
  
  if(column&&column.clicks) {
    for(var i=0; i<column.clicks.length; i++) {
      column.clicks[i]();
    }
  }
},
  
_column_dblclick : function(nCol) {},

sortTable : function(col, rev, cmpfunc) {
  // Get the table or table section to sort.
  var _this = this;
  var column = this.columns[col];
  var columnName = column.name;
  
  var tblEl = _this.wndTableData.tBodies[0];
  // The first time this function is called for a given table, set up an
  // array of reverse sort flags.
  if (tblEl.reverseSort == null) {
    tblEl.reverseSort = new Array();
    // Also, assume the team name column is initially sorted.
    tblEl.lastColumn = 1;
  }
  // If this column has not been sorted before, set the initial sort direction.
  if (tblEl.reverseSort[col] == null)
  tblEl.reverseSort[col] = rev;
  // If this column was the last one sorted, reverse its sort direction.
  if (col == tblEl.lastColumn)
  tblEl.reverseSort[col] = !tblEl.reverseSort[col];
  // Remember this column as the last one sorted.
  tblEl.lastColumn = col;
  // Set the table display style to "none" - necessary for Netscape 6
  // browsers.
  var oldDsply = tblEl.style.display;
  tblEl.style.display = "none";
  // Sort the rows based on the content of the specified column using a
  // selection sort.
  var tmpEl;
  var i, j;
  var minVal, minIdx;
  var testVal;
  var cmp;
  
  for (i = 0; i < tblEl.rows.length - 1; i++) {
    // Assume the current row has the minimum value.
    minIdx = i;
    //alert(tblEl.rows[i].data)
    minVal = tblEl.rows[i].data;    // getTextValue(tblEl.rows[i].cells[col])
    // Search the rows that follow the current one for a smaller value.
    for (j = i + 1; j < tblEl.rows.length; j++) {
      testVal =  tblEl.rows[j].data; //getTextValue(tblEl.rows[j].cells[col]);
      cmp = cmpfunc(minVal, testVal, columnName);
      
      // Negate the comparison result if the reverse sort flag is set.
      if (tblEl.reverseSort[col])
        cmp = -cmp;
      // Sort by the second column (team name) if those values are equal.
      //if (cmp == 0 && col != 1)
      //  cmp = cmpfunc(getTextValue(tblEl.rows[minIdx].cells[1]), getTextValue(tblEl.rows[j].cells[1]));
      // If this row has a smaller value than the current minimum, remember its
      // position and update the current minimum value.
      if (cmp > 0) {
        minIdx = j;
        minVal = testVal;
      }
    }
    // By now, we have the row with the smallest value. Remove it from the
    // table and insert it before the current row.
    if (minIdx > i) {
      tmpEl = tblEl.removeChild(tblEl.rows[minIdx]);
      tblEl.insertBefore(tmpEl, tblEl.rows[i]);
      // tblEl.rows[minIdx].swapNode(tblEl.rows[i]);
    }
  }
  // Restore the table's display style.
  tblEl.style.display = oldDsply;
  return false;
},

onClickColumn : function(nCol) {},
onDblClickColumn : function(nCol) {},
onInitCell : function(TD, nItem, nCol, json) {},
  
_init_cell : function(container, nItem, nCol, json) {},
  
// 处理鼠标单击事件，处理之后传递给外部接口_rows_onclick
_rows_onclick : function(row) {
  var _this = this;
  if(!_this.row_is_enabled(row)) {
    return false;
  }

  var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
  
  // 不支持多选
  if(!_this.isMultiSelect()) {
    if(!_this.row_is_selected(row)) {
      _this.rows_selected.each(function(rowNode, key) {
        _this.row_set_selected(rowNode, false);
      });
      _this.row_set_selected(row, true);
    } else {
      _this.row_set_selected(row, false);  
    }
    
  } else {
    if(_this.isCheckBoxStyle()) {
      _this.row_set_selected(row, !_this.row_is_checked(row));  
    } else {
      if(_this.select_mode == SELECT_MODE_CTRL) { // CTRL键按下时
        _this.row_set_selected(row,!_this.row_is_selected(row));  
      } else if(_this.select_mode == SELECT_MODE_SHIFT) { // SHIFT键按下时
      } else {
        _this.rows_selected.each( function(node, key) { 
            _this.row_set_selected(_this.rows_selected.item(key),false);
          });
        _this.row_set_selected(row, true);
      }
    }
  }
  _this.row_onclick(row);
},
  
// 处理鼠标滑过事件，处理之后传递给外部接口row_onmouseover
_rows_onmouseover : function(row) {
  var _this = this;
  if(_this.row_is_enabled(row)) {
    var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
    if(!_this.row_is_selected(row)) {
      _this.row_onmouseover(row);
    }
  } 

},

// 处理鼠标离开事件，处理之后传递给外部接口row_onmouseout  
_rows_onmouseout : function(row) {
  var _this = this;
  var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
  if(_this.row_is_enabled(row)) {
    if(!_this.row_is_selected(row)) {
      _this.row_onmouseout(row);
    }
  }
},

// events
row_onclick : function(row) {},
row_onmouseover : function(row) {},
row_onmouseout : function(row){},
row_oninsert : function(row, record) {},

rows_each : function(callback) {
  var _this = this;
  if(typeof callback != 'function') { alert('rows_each callback was not a function'); return; }
  for(var i=0; i < _this.wndTableData.rows.length; i++) {
    callback(_this.wndTableData.rows[i]);
  }
},

row_enable : function(row, enabled) {
  var _this = this;
  var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
  // 设置选中颜色
  // _this.row_set_color(row, '#DFE8F6'); //'#A2CAEA'
  row.getAttribute('_disabled', !enabled);
  if(_this.isCheckBoxStyle()) {
    _this.checkboxes.item(dataIndex).disabled = !enabled;
  }
},
  
row_remove : function(row) {
  var _this = this;
  try {
    var record = _this.jstore.records[_this.get_row_dataIndex(row)];
    _this.wndTableData.deleteRow(row.rowIndex);
    _this.jstore.remove(record);
    _this.autosize();
  } catch(e) {
    alert(e.description);
  }
},
  
row_insert : function(index, record) {
  var _this = this;
  _this.jstore.push(record);
  _this.insertrow(index, record);
  _this.autosize();
},

row_is_enabled : function(row) {
  return (!row.getAttribute('_disabled'));
},

row_is_checked : function(row) {
  var _this = this;
  var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
  if(_this.isCheckBoxStyle()) {
    return _this.rows_checked.item(dataIndex).checked;
  }
  return false;
},

row_is_selected : function(row) {
  var _this = this;
  var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
  return _this.rows_selected.has(dataIndex);
},

// 设置选择
rows_selected_all : function(bSelectAll) {
  var _this = this;
  _this.rows_each(function(row) {
    _this.row_set_selected(row, bSelectAll);
  });
},  
  
row_set_color : function(row, bgColor) {
  row.style.background = bgColor;
},
  
row_set_selected : function(row, bSelected) {
  var _this = this;
  if(_this.row_is_enabled(row)) {
    var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
    // 设置颜色
    if(bSelected) {
      _this.row_set_color(row, '#DFE8F6'); //'#A2CAEA'
      _this.rows_selected.add(dataIndex, row);
    } else {
      _this.row_set_color(row, 'none');
      _this.rows_selected.remove(dataIndex);
    }      

    if(_this.isCheckBoxStyle()) {
      _this.rows_checked.item(dataIndex).checked = bSelected;
      _this.wndTableHeaderRow.cells[0].childNodes[0].childNodes[0].childNodes[0].checked = (_this.rows_selected.length == _this.wndTableData.rows.length);  
    }
  }  
},
  
get_records : function(row) {
  var _this = this;
  var dataIndex = parseInt(_this.get_row_dataIndex(row), 10);
  var store = _this.jstore;
  var arr = [];
  if(-1 == dataIndex) {  
    _this.jstore.records.each(function(node, i) { arr.push(node); });
    return arr;
  }

  if(store.records.has(dataIndex) ) {
    arr.push(store.records.item(dataIndex));
    // alert("get_records:" + store.records.item(dataIndex));
    return arr;  
  } else {
    alert('无效数据索引['+dataIndex+']!');
    return null;
  }
},

get_data_store : function() {
},
  

get_rows_selected : function() {
  var _this = this;
  var arr = [];
  _this.rows_selected.each(function(node, key){
    arr.push(_this.rows_selected.item(key));
  });
  return arr;
},
  
get_row_dataIndex : function(row) {
  if(row.nodeType == 1) {
    return parseInt(row.getAttribute('dataIndex'),10);  
  } else {
    return -1;
  }
},

get_width : function() {
},

get_height : function() {
},
  
get_text : function(row, fieldName) {
  var _this = this;
  var record = _this.get_records(row)[0];
  return record[fieldName];
},
  
set_text_index : function(row, cellIndex, szText, isHTML) {
    
},
  
set_text : function(row, fieldName, szText, isHTML) {

},
  
// 工具栏插件注册
plugin_register : function(plugin, isNotSplit) {
    
},
  
  sync_scroll : function() {}
}; 

