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
