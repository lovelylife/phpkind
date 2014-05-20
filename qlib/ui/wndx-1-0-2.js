/*--------------------------------------------------------------------------------
 $ 文档：wndx.js
 $ 功能：封装的窗口api和相关定义
 $ 日期：2007-10-09 15:47
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://jshtml.com] All rights reservered.

 1. 解决窗口拖动时，鼠标位置
 2. 改进模式对话框遮罩问题
 3. 去除XML方式加载资源
----------------------------------------------------------------------------------*/

// global const variables definition
var CONST = {
/*-------------WINDOWS DEFINE -----------------------------*/
  SW_SHOW:           0x0001,
  SW_HIDE:           0x0000,

/*----------------------------------------------
  STYLE: |0|0|0|0|0|0|0|0|
  ----------------------------------------------*/
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
  STYLE_POPUP :    0x00000100,

  STYLE_CHILD :    0x00000200,
  STYLE_ICON  :    0x00000400,
  STYLE_WITHBOTTOM :  0x00000800,
  
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
  NORMAL :            '0',
  MODE:              '1',
  MODELESS:           '2',
  IDCANCEL :          '0'
};

CONST.STYLE_DEFAULT = CONST.STYLE_TITLE|CONST.STYLE_ICON|CONST.STYLE_MAX|CONST.STYLE_MIN|CONST.STYLE_CLOSE;

/*-------------------------------------------------------------------------
  you must defined the function MessageProcedure in the handle as a memeber
---------------------------------------------------------------------------*/
var __GLOBALS = {};
__GLOBALS.MIN_HEIGHT = 32;
__GLOBALS.MIN_WIDTH  = 100;
__GLOBALS.Z_INDEX    = 10000;
__GLOBALS.count      = 0;

// global windows  
Q.Ready(function() {
  __GLOBALS.desktop = document.body;
  __GLOBALS.desktop.wnds = new Q.LIST();
  __GLOBALS.desktop.active_wnd = null;
  __GLOBALS.desktop.wnd_mask = document.createElement('DIV');
  __GLOBALS.desktop.wnd_mask.className = 'clsMaskWindow alpha_5';
  __GLOBALS.desktop.appendChild(__GLOBALS.desktop.wnd_mask);
  __GLOBALS.desktop.wnd_mask.style.display = 'none';
  (new __DRAGWND());
}, true);

/*-----------------------------------------------------------------
  common APIs
-------------------------------------------------------------------*/
// check the statement wether be null
function $IsNull(statement) {
  return  (statement == null);  
}

function $IsStyle(cs, style) { return ((cs & style) == style); }
function $IsWithStyle(style, wstyle) { return ((style & wstyle) == style); }

function $BindWindowMessage(wndNode, messageid, parameters) {
  return function() {
    wndNode.wnd_proc(wndNode, messageid, parameters);
  }
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
  parent.wnds.append(wndNode);
}

function $UnRegisterWindow(wndNode) {
  if( $IsNull(wndNode) ) {
    return;
  }
  var parent = $GetParentWindow(wndNode);
  if( $IsNull(parent) ){
    alert('unregister error, invalid parent');
    return;
  }
  parent.wnds.erase(wndNode);
}

function $CreateMaskWindow() {

}

function $IsWindow(wndNode){
  if($IsNull(wndNode)) 
    return false;
  var parent = $GetParentWindow(wndNode);
  if( $IsNull(parent) ){
    return false;
  }
  
  return !$IsNull(parent.wnds.find(wndNode));
}

function $ShowWindow(wndNode, ws){
  if( ws == CONST.SW_SHOW ){
    wndNode.style.display = '';
    if( $IsWindow(wndNode) )
      $ActivateWindow(wndNode);
  } else if( ws == CONST.SW_HIDE ) {
    wndNode.style.display = 'none';
    //$MaskWindow(wndNode, false);
  }
}

// do modifying
function $IsMaxWindow(wndNode) {
  return ($IsStyle($GetWindowStyle(wndNode), CONST.STYLE_MAX) && (CONST.SIZE_MAX == $GetWindowStatus(wndNode)));
}

function $DestroyWindow(wndNode){
  var parent_wnd = $GetParentWindow(wndNode);
  $UnRegisterWindow(wndNode);
  wndNode.parentNode.removeChild(wndNode);
  wndNode = 0;

  var wnd = $GetTopZIndexWindow(parent_wnd);
  if( $IsWindow(wnd) ) {
    $ActivateWindow(wnd);
  } else {
    $ActivateWindow(parent_wnd);
  }
}

/*----------------------------------------------------
 窗口激活模式 $ActiveWindow

RootWindow (__GLOBALS.desktop)  
 |               
 +--active_wnd---> Window 1 
 |        +---------------- child window 1
 |        +---active_wnd---> child window 2
 |        +---------------- child window 3
 |
 +-------------- Window 2
 +-------------- Window 3

 桌面窗口           __GLOBALS.desktop (document.body) 
 桌面窗口的子窗口   TopWindow (QWindow)
 窗口激活流程如下
 
 [wndNode] 
    |
 [$IsWindow]   
    | No
    +---------> [return]
    | Yes
 [$GetTopWindow(wndNode) == __GLOBALS.desktop.active_wnd]
    | No
    |                          [SetWindowActive(__GLOBALS.desktop.active_wnd, false)]
    +------------------------- [__GLOBALS.desktop.active_wnd = $GetTopWindow(wndNode)]
    |                          [SetWindowActive(__GLOBALS.desktop.active_wnd, true)]
    |
    |
    | Yes
 [$SetWindowActive(wndNode, true)]

------------------------------------------------------*/
function $ActivateWindow(wndNode) {
  if( !$IsWindow(wndNode)) { return; }

  // 保存当前激活窗口
  var active_wnd = $GetActiveWindow(__GLOBALS.desktop);
  var p = wndNode;
  var is_child_of_active_window = false;
  while(p && p != __GLOBALS.desktop) {
    if(p == active_wnd) {
      is_child_of_active_window = true;
      break;
    }
    p = $GetParentWindow(p);
  }

  var parent = $GetParentWindow(wndNode);
  if(is_child_of_active_window) {
    var active_sibling = $GetActiveWindow(parent);
    if(wndNode == active_sibling) {
      return;
    } else {
      // deactive sibling, active self
      $SetWindowActive(active_sibling, false);
      $SetWindowActive(wndNode, true);
      
      // z
      var z_active_wnd = $GetWindowZIndex(active_sibling);
      $SetWindowZIndex(wndNode, z_active_wnd + 1);
      parent.active_wnd = wndNode;
    }
  } else {
    var top_window = $GetTopWindow(wndNode);
    __GLOBALS.desktop.active_wnd = top_window;
    $SetWindowActive(active_wnd, false);
    $SetWindowActive(wndNode, true);
      
    // z
    var z_active_wnd = $GetWindowZIndex(active_wnd);
    $SetWindowZIndex(top_window, z_active_wnd + 1);
  }
  
  /*  
  if( $GetModalType(wndNode) == CONST['MODE'] ){
    var tp = $GetParentWindow(wndNode);
    $ActivateWindow(tp);
    $MaskWindow(tp, true);
  }*/
}

function $SetWindowActive(wndNode, IsActive){
  if(!$IsWindow(wndNode) || (wndNode == $GetDesktopWindow())) {  return; }
  var style;
  style = (IsActive) ? 'clsActiveTitle' : 'clsNoActiveTitle';
  
  var p = $GetParentWindow(wndNode);
  while(p && p != $GetDesktopWindow()) {
    $GetTitle(p).className = style;
    p = $GetParentWindow(p);
  }

  var active_child = wndNode;
  while(active_child) {
    $GetTitle(active_child).className = style;
    active_child = $GetActiveWindow(active_child);
  }
}

function $MaxizeWindow(wndNode){
  if( !$IsWindow(wndNode) ){ return; }
  var ws = $GetWindowStyle(wndNode);
  //if( !$IsStyle(ws, CONST.STYLE_MAX) ) {  return; }
  if( $GetWindowStatus(wndNode) == CONST.SIZE_MAX ) { return; };
  var parent = $GetParentWindow(wndNode);
  var width, height;
    if( parent == document.body ) {
    width = Math.max(document.body.clientWidth, document.body.scrollWidth);
    height = Math.max(document.body.clientHeight, document.body.scrollHeight);
  } else if( $IsWindow(parent) ) {
    width  = Math.max($GetClient(parent).clientWidth, $GetClient(parent).scrollWidth);
    height = Math.max($GetClient(parent).clientHeight, $GetClient(parent).scrollHeight);
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
  if( !$IsWindow(wndNode)) { return; }
  if( $GetWindowStatus(wndNode) == CONST.SIZE_NIN )
    return;
  var ws = $GetWindowStyle(wndNode);
  if( $IsStyle(ws, CONST.STYLE_FIXED)) { return; }
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
  $ResizeTo(wndNode, __GLOBALS.MIN_WIDTH, $GetTitle(wndNode).offsetHeight);
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
  wndNode.szTitle = title;
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

function $SetTitleWidth(wndNode, width){ $GetTitleContent(wndNode).style.width = width + 'px'; }
function $SetTitleHeight(wndNode, height){ $GetTitleContent(wndNode).style.height= height+ 'px'; }
function $SetWindowStatus(wndNode, status) { wndNode.status_type  = status; }
function $SetWindowZIndex(wndNode, zIndex) {
  if( isNaN(parseInt(zIndex)) ){
    return;
  }
  wndNode.style.zIndex = zIndex;
}

/*-----------------------------------------------------------------
  windows APIs Get Methods
-------------------------------------------------------------------*/

function $IsDesktopWindow(wndNode) { return (__GLOBALS.desktop == wndNode); }
function $GetDesktopWindow() { return __GLOBALS.desktop; }
function $GetMaskWindow(wndNode) { return wndNode.wnd_mask; }
function $GetActiveWindow(wndNode) { return wndNode.active_wnd; }
function $GetCurrentActiveWindow() {
  // get active window 
  var wndNode = $GetDesktopWindow();
  while(wndNode && wndNode.active_wnd) {
    wndNode = wndNode.active_wnd;
  }
  return wndNode;
}

function $GetWindowZIndex(wndNode){
  if(wndNode && wndNode.style && wndNode.style.zIndex) {
    return parseInt(wndNode.style.zIndex, 10);
  } else {
    return __GLOBALS.Z_INDEX;
  }
}

function $GetModalWindow(wndNode){
  if( $IsNull(wndNode.modalWnd) )
    return wndNode;
  else
    return $GetModalWindow(wndNode.modalWnd);
}

function $GetParentWindow(wndNode) { return wndNode.parent_wnd; }
function $GetSubWindow(wndNode){ return wndNode.wnds; }
function $GetMinCtrlButton(wndNode){ return wndNode.hTitle.hMin; }
function $GetMaxCtrlButton(wndNode){ return wndNode.hTitle.hMax; }
function $GetTitleContent(wndNode){ return wndNode.hTitleContent; }
function $GetTitle(wndNode){ return wndNode.hTitle; }
function $GetBottomBar(wndNode) { return wndNode.hBottomBar; }
function $GetWindowStatus(wndNode){ return wndNode.status_type ; }
function $GetWindowStyle(wndNode){ return wndNode.wstyle; }
function $GetClient(wndNode) { return wndNode.hClientArea; }

function $GetTopZIndexWindow(){
  var parent_wnd;
  if( arguments.length > 0 && $IsWindow(arguments[0]) ) {
    parent_wnd = arguments[0];
  } else {
    parent_wnd = $GetDesktopWindow();
  }
  var wnds = $GetSubWindow(parent_wnd);
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

function $GetTopWindow(wndNode) {
  var top_window = wndNode;
  var p = $GetParentWindow(wndNode);
  while(p && p != $GetDesktopWindow()) {
      top_window = p;
      p = $GetParentWindow(p);
  }

  return top_window;
}


// 获得最先显示的深度
function $GetModalZIndex(wndNode) {
  var node;
  for(node = $GetModalWindow(wndNode); $GetModalWindow(node) != null; node = $GetModalWindow(wndNode)) {}
  return $GetWindowZIndex(node);
}

function $GetRect(wndNode) {
  var top, left, bottom, right;
  if(wndNode == __GLOBALS.desktop) {
    top   = 0;
    left   = 0;
    bottom  = document.body.scrollHeight + top;
    right  = document.body.scrollWidth + left;
  } else {
    top    = parseInt(wndNode.style.top, 10);
    left  = parseInt(wndNode.style.left, 10);
    bottom  = parseInt(wndNode.style.top, 10) + wndNode.style.offsetHeight;
    right  = parseInt(wndNode.style.left, 10) + wndNode.style.offWidth;
  }
  return {top:top, left:left, bottom:bottom, right:right};
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
  var client = $GetClient(wndNode);  // 重画客户区
  // var title  = $GetTitle(wndNode);
  var ws = $GetWindowStyle(wndNode);
  var lastHeight = height;
  
  if( $IsStyle(ws, CONST.STYLE_TITLE)) {
    lastHeight = lastHeight - $GetTitle(wndNode).offsetHeight;
  }

  if( $IsStyle(ws, CONST.STYLE_WITHBOTTOM)) {
    lastHeight = lastHeight - ($GetBottomBar(wndNode).offsetHeight);
  }
  client.style.height = Math.max(lastHeight - 0, __GLOBALS.MIN_HEIGHT)+'px';
  client.style.width = Math.max(width - 0, __GLOBALS.MIN_WIDTH) + 'px';
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

function $AddDragObject(wndNode, obj) {
  wndNode.wnd_drags.append(obj);
}

function $RemoveDragObjects(wndNode, obj) {
  wndNode.wnd_drags.erase(obj);
}

function $IsDragObject(wndNode, obj) {
  if(!$IsWindow(wndNode))
    return false;

  return wndNode.wnd_drags.find(obj);
}

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
    wndNode.hBottomBar.style.display = '';
  } else {
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
    $ActivateWindow(hwnd);
    break;  
  }
} 

function $CreateWindow(parent_wnd, title, ws, left, top, width, height){
  var hwnd = document.createElement('DIV');
  // user data
  hwnd.wnd_id = __GLOBALS.count ++;
  hwnd.wstyle    = ws || CONST.STYLE_DEFAULT;  // 窗口样式
  hwnd.wnds      = new Q.LIST();  
  hwnd.wnd_drags = new Q.LIST();
  hwnd.active_wnd = null;  // 当前活动的子窗口句柄
  hwnd.szTitle = title || 'untitled';
  hwnd.status_type  = CONST.SIZE_NORMAL;
  hwnd.wnd_proc = $DefaultWindowProc;

  // dom attributes
  hwnd.className = 'clsWindows';
  hwnd.style.display = 'none';
  hwnd.style.zIndex = __GLOBALS.Z_INDEX;
 
  if( !isNaN(top)) {
    hwnd.nTop = hwnd.rtop = top;
    hwnd.style.top = top + 'px'; // 窗口顶点位置
  }
  if( !isNaN(left)) {
    hwnd.nLeft = hwnd.rleft = left;
    hwnd.style.left = left + 'px'; // 窗口左边距离
  }
  if( !isNaN(width) ) {
    hwnd.nWidth = hwnd.rwidth = width;
    hwnd.style.width = width + 'px';        // 窗口宽度
  }
  if( !isNaN(height) ) {
    hwnd.nHeight = hwnd.rheight = height;
    hwnd.style.height = height + 'px';        // 窗口宽度
  }

  // container && parent 
  if ( !$IsWindow(parent_wnd) )  
    parent_wnd = $GetDesktopWindow();

  var container = null;
  if( $IsStyle(hwnd.wstyle, CONST.STYLE_CHILD) ) {
    if(parent_wnd != $GetDesktopWindow()) {
      container = $GetClient(parent_wnd);
    }
  }
  
  if(!container) 
    container = $GetDesktopWindow();

  container.appendChild(hwnd);
  hwnd.parent_wnd = parent_wnd;

  // 主窗口
  //if( !$IsStyle(ws, CONST.STYLE_FIXED) ) {
  //  $MakeResizable(hwnd);
  //}
  
  $SaveRectForWindow(hwnd);
  Q.addEvent(hwnd, 'mousedown', $BindWindowMessage(hwnd, MESSAGE.ACTIVATE));

  // initial title bar
  $CreateWindowTitlebar(hwnd);
  $SetWindowTitle(hwnd, hwnd.szTitle);

  hwnd.hClientArea = document.createElement('DIV');
  hwnd.hClientArea.className = 'clsClientArea';
  hwnd.appendChild(hwnd.hClientArea);
  
  // bottom bar
  hwnd.hBottomBar = document.createElement('DIV');
  hwnd.hBottomBar.className = 'clsBottomBar';
  hwnd.appendChild(hwnd.hBottomBar);

  // mask window
  hwnd.wnd_mask   = document.createElement('DIV');  //用来屏蔽鼠标
  hwnd.wnd_mask.className = 'clsMaskWindow alpha_5';
  hwnd.wnd_mask.onclick   = function() { }
  hwnd.wnd_mask.onselectstart = function() { return false; }
  hwnd.appendChild(hwnd.wnd_mask);
  hwnd.wnd_mask.style.display = 'none';

  $SetWindowStyle(hwnd, ws);
  $RegisterWindow(hwnd);
  $BindWindowMessage(hwnd, MESSAGE.CREATE)();
  
  return hwnd;
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
  hTitle.onselectstart = function(){return false;};
  hTitle.ondblclick = function() {
    Q.printf('WINDOW title dblclick');
    $BindWindowMessage(hwnd, MESSAGE.MAX)();
  }

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

/*-----------------------------------------------------------------
 $MaskWindow
 $parameter: wndNode - which will be masked
        bMask - if mask or not
 $date: 2008-05-11
-------------------------------------------------------------------*/

function $MaskWindow(wndNode, bMask){
  console.log(wndNode);
  var wnd_mask = $GetMaskWindow(wndNode);  // 获得遮罩窗口句柄及其窗口的深度
  if(!wnd_mask) {
    console.log('mask window not exists')
    return;
  }
  //var nIndex = parseInt($GetWindowZIndex(wndNode),10);
  if( bMask ) {    // 遮罩该窗口
    console.log('mask window');
    //var rect = $GetRect(wndNode);  // 获得该窗口的位置， 显示遮罩窗口
    wnd_mask.style.display = '';
    //wnd_mask.style.position = 'absolute';
    /*
        wnd_mask.style.top     = rect.top;
    wnd_mask.style.left    = rect.left;
        wnd_mask.style.width    = (rect.right - rect.left)+'px';
    wnd_mask.style.height   = (rect.bottom - rect.top)+'px';
    */

    //wnd_mask.style.top     = 0;
    //wnd_mask.style.left    = 0;
    //wnd_mask.style.width    = document.body.scrollWidth+'px';
    //wnd_mask.style.height   = document.body.scrollHeight+'px';

    //if(isNaN(nIndex)) {
    //    nIndex = 1;
    //}
    //wnd_mask.style.zIndex  = nIndex + 1;
  } else {  // 取消遮罩
    console.log('hide mask window');
    wnd_mask.style.display = 'none';
  }
}

function $MakeResizable(obj) {
  return;
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
      if( ( status != CONST.SIZE_MAX ) && 
      ( status == CONST.SIZE_RESIZING ) && 
      ( evt.button == Q.LBUTTON ) )
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

  function mousemove(evt){
    evt = evt || window.event;
    var srcElement = evt.srcElement || evt.target;
    //Q.printf(srcElement);
    var status = $GetWindowStatus(obj);
    if(( status & CONST.SIZE_MAX ) 
      || ( $IsStyle($GetWindowStyle(obj), CONST.STYLE_FIXED) ) 
      || (status == CONST.SIZE_MIN))
    {
      //Q.printf('wrong status');
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

    if(target_wnd && $IsDragObject(target_wnd, oDragHandle)) {
      _this.isdrag = true; 
      _this.hCaptureWnd = target_wnd; 
      _this.beginY = parseInt(_this.hCaptureWnd.style.top+0); 
      _this.y = _this.nn6 ? evt.clientY : evt.clientY; 
      _this.beginX = parseInt(_this.hCaptureWnd.style.left+0); 
      _this.x = _this.nn6 ? evt.clientX : evt.clientX;
        
      _this.hDragWnd.style.display = 'none';
      _this.hDragWnd.style.width = _this.hCaptureWnd.offsetWidth + 'px';
      _this.hDragWnd.style.height = _this.hCaptureWnd.offsetHeight + 'px';
      _this.hDragWnd.style.top = _this.hCaptureWnd.style.top;
      _this.hDragWnd.style.left = _this.hCaptureWnd.style.left;
        
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
      Q.removeEvent(document,'mousemove',_this.MouseMove_Handler);
      _this.isdrag=false;
      _this.hDragWnd.style.display = 'none';
      _this.isMoved && $MoveTo(_this.hCaptureWnd, _this.endX, _this.endY);
      $ShowWindow(_this.hCaptureWnd, CONST.SW_SHOW);
    }
    _this.isMoved=false;
  }
});

/*-----------------------------------------------------------------
 $ class Q.Window
 $ dialog base class
 $ date: 2014-05-16
-------------------------------------------------------------------*/
function $GetQWindow(wndNode) {
  return wndNode.qwindow_object;
}

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
  if(config.parent instanceof Q.Window) {
    parent_wnd = config.parent.wnd() || $GetDesktopWindow();
  }

  config.wstyle = config.wstyle || CONST.STYLE_DEFAULT;
  this.hwnd = $CreateWindow(parent_wnd, title, config.wstyle, left, top, width, height);  
  this.set_content(config.content);
},

window_proc : function(msg, data) {
  switch(msg) {
  case MESSAGE.CREATE:
    break;
  case MESSAGE.CLOSE:
    break;
  }
  return $DefaultWindowProc(this.hwnd, msg, data);
},

show : function(isVisible) {
  var show=isVisible?CONST.SW_SHOW:CONST.SW_HIDE;
  $ShowWindow(this.hwnd, show);
},

center : function() {
  $CenterWindow(this.hwnd);
},

adjust : function() {
  $FitWindow(this.hwnd);				 
},

destroy : function() {
  if(!this.hwnd) 
    return;
  var parent_wnd = $GetParentWindow(this.hwnd);
  $MaskWindow(parent_wnd, false);
  $ActivateWindow(parent_wnd);
  $DestroyWindow(this.hwnd);
  this.hwnd = null;
},

wnd : function() {
  return this.hwnd;      
},

set_content : function(HTMLContent) {
  HTMLContent = HTMLContent || "";
  if(HTMLContent && HTMLContent.nodeType == Q.ELEMENT_NODE) {
    $GetClient(this.hwnd).appendChild(HTMLContent);
    HTMLContent.style.display = '';
  } else {
    $GetClient(this.hwnd).innerHTML = HTMLContent;
  }
},

set_zindex : function(zIndex) {
  $SetWindowZIndex(this.hwnd, zIndex);
},

});

/*-----------------------------------------------------------------
 $ class Q.Dialog
 $ dialog base class
 $ date: 2007-11-20
-------------------------------------------------------------------*/
Q.Dialog = Q.Window.extend({
construct : function(config) {
  config = config || {};
  config.wstyle = config.wstyle || CONST.STYLE_DEFAULT;
  config.wstyle |= CONST.STYLE_FIXED;
  config.wstyle |= CONST.STYLE_CLOSE;
  config.wstyle |= CONST.STYLE_WITHBOTTOM;
  config.wstyle &= ~CONST.STYLE_MAX;
  config.wstyle &= ~CONST.STYLE_MIN;
  config.wstyle &= ~CONST.STYLE_ICON;

  this.__super__.construct(config);
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
},

domodal : function() {
  var parent_wnd = $GetParentWindow(this.hwnd);
  //if(parent != $GetDesktopWindow()) {
//    console.log('domodal window');
//    $MaskWindow(parent_wnd, true);
//    parent_wnd.modalWnd = this.hwnd;
  //}
  var _this = this;
  //this.hwnd.close.onclick = function() {
  //   _this.end_dialog(CONST.IDCANCEL); 
  //};
  this.show(true);
  $ResizeTo(this.hwnd, this.hwnd.nWidth, this.hwnd.nHeight);
  this.center();
},
 
end_dialog : function(code) {
  this.destroy();
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
    dlg.add_bottom_button('  是  ', 'sysbtn',
      function(){
        var return_ok = true;
        if(dlg.onok)  { 
          return_ok = dlg.onok(); 
        }
        if(return_ok) {
          dlg.end_dialog();
        }          
      }
    )
  }
    
  if( $IsWithStyle(MSGBOX_NO, config.bstyle) ) {
    dlg.add_bottom_button('  否  ', 'sysbtn',
      function(){
        if(dlg.onno){ dlg.onno(); }
        dlg.end_dialog();
      }
    )
  }

  if( $IsWithStyle(MSGBOX_CANCEL, config.bstyle) ) {
    dlg.add_bottom_button(' 取消 ', 'syscancelbtn',
        function(){
          if(dlg.oncancel){ dlg.oncancel(); }
          dlg.end_dialog();
        }
      )
  }

  dlg.domodal();
  dlg.adjust();
  dlg.center();
}

