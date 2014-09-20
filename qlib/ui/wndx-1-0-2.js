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

function $MaskWindow(wndNode, bmask) { $GetMask(wndNode).style.display=(!!bmask)?'':'none'; }
function $CreateMaskLayer(wndNode) {
  wndNode.layer_mask = document.createElement('DIV');
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
      Q.printf('DefaultWindowProc MESSAGE.ACTIVATE');
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

