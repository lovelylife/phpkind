/*-------------------------------------------------------
 $ name:     drag components
 $ function: ��ק���
 $ date: 2008-12-25
 $ author: lovelylife
---------------------------------------------------------*/


// �������Ԫ���Ƿ����ص�, ����Ǳ�Եʱ�������Ե�غϣ������������ص���Ҳ���ǻ᷵��false;
function mousedownCheck(curObject, tarObject) {
	var cpos = null, tpos = null;
	cpos = $GetAbsPosition(curObject);
	tpos = $GetAbsPosition(tarObject);
	var isX = false, isY = false;
	if( ((cpos.left >= tpos.left) && (cpos.left <= (tpos.left + tpos.width - 1))) || (((cpos.left + cpos.width - 1) >= tpos.left) && ((cpos.left + cpos.width - 1) <= (tpos.left + tpos.width -1 ))) ) {
		isX = true;
	}
	
	if( ((cpos.top >= tpos.top) && (cpos.top <= (tpos.top + tpos.height - 1)))
		|| (((cpos.top + cpos.height - 1) >= tpos.top) && ((cpos.top + cpos.height - 1) <= (tpos.top + tpos.height - 1))) ) {
		isY = true;
	}
	
	return isY && isX;
	
}

// �ж�ĳ���Ƿ���ָ��obj��������
function checkPointInArea(pt, obj) {
	var pos = $GetAbsPosition(obj);
	var isX = false, isY = false;
	
	if( (pt.x >= pos.left) && (pt.x <(pos.left + pos.width -1))) {
		isX = true;	
	}
	
	if( (pt.y >= pos.top) && (pt.y <(pos.top + pos.height -1))) {
		isY = true;	
	}
	
	return isX && isY;
}

// �϶����Ϲ���
var $dragManage = {
	drags : new Object,
	dragingNode : null,
	register : function(className, XPath) {
		try {
			XPath = XPath.toString();
			className = className.toString();
		    if( className == "") {
		        // ���������û�ж���
		        return false;
		    } else {
			    if(this.drags[className] != undefined ) {
				    alert('['+ className + '] has been registered');
				    return false;
				}    
			    this.drags[className] = XPath;
		    }
		    return true;
		} catch(e){
			alert(e.description);
		}
	},
	
	unregister: function(className) {
		delete this.drags[className];	
	},
	
	getdragWnd : function() {
		return this.dragingNode;
	},
	
	setdragWnd : function(node) {
		this.dragingNode = node;
	}
};

function XQuery(rootNode, XQL) {
	XQL = XQL.replace(/\\/ig, '/');
	if(XQL.substr(0, 1) == '/') {
		XQL = XQL.substring(1, XQL.length);	
	}
	XQL = XQL.split('\/');
	//alert(XQL)
	return traverse(rootNode, XQL, 0);
}


function traverse(rootNode, arr, l) {
	var inf = arr[l];
	var tagName = null;
	var attr = null;
	var value = null;
	var b = false;
	var islast = (l == arr.length -1 );
	var re = /([^0-9]+?)\[@(.+?)=(.+?)\]/ig; // ƥ������xxx[@xxx=xxx], xΪ�ַ���������
	if( re.test(inf) ) {
		tagName = RegExp.$1;
		attr    = RegExp.$2;
		value	= RegExp.$3;
		b = true;
	} else {
		tagName = inf;
	}
	var childNodes = rootNode.getElementsByTagName(tagName);
	if(childNodes.length < 1) {
		return null;	
	}
	
	if(islast) {
		if(b) {
			for(var i=0; i < childNodes.length; i++) {
				var node = childNodes[i];
				if(node.getAttribute(attr) == value.toLowerCase()) {
					return node;
				}
			}
			return null;
		} else {
			return childNodes;
		}
	} else {
		for(var i=0; i < childNodes.length; i++) {
			var node = childNodes[i];
			// �����Ժ�ֵ��
			if(node.getAttribute(attr) == value.toLowerCase()) {
				var t = traverse(node, arr, l+1);
				if(t) {	return t; }
				break;
			}  else {
				var t = traverse(node, arr, l+1);
				if(t) {	return t; }
			}
		}
	}
	return null;
}



g_tNode = null;

// ��ʼ����ק����
(function() {
	this.dragWnd = null;
	this.ie = document.all;
	this.nn6 = document.getElementById&&!document.all,
	this.isdrag = false;
	this.x = -1;
	this.y = -1;
	this.stX = -1;
	this.stY = -1;
	var _this = this;		// ����thisָ�뵽�¼����������
	function _initdragment(e) {
		if(event.button == 2){	return;	} // �����Ҽ��϶�
		var oDragHandle = _this.nn6 ? e.target : event.srcElement; // ��ȡ�����ͣ���ڵĶ�����
		
		// ���ָ��class�Ķ���
		var pNode = oDragHandle;
		var bFounded = false;
		while(!(pNode == document.body)) {
			if($dragManage.drags[pNode.className.toLowerCase()]) {
				bFounded = true;
				break;	
			}
			pNode = pNode.parentNode;
		}
		if(bFounded) {
			// �����ƶ�����
			var nd = XQuery(pNode, $dragManage.drags[pNode.className.toLowerCase()]);
			if(nd == null) {
				return;	
			}
			if(nd.toString() == '[object HTMLCollection]') {
				//alert(1)
				pNode = oDragHandle;
				bFounded = false;
				while(!(pNode == document.body)) {
					for(var i=0; i < nd.length; i++) {
						if(pNode == nd[i]) {
							bFounded = true;
							break;	
						}
					}
					if(bFounded) {
						break;
					}
					pNode = pNode.parentNode;
				}
				if(bFounded) {
					g_tNode = pNode;	
				}
			} else {
				g_tNode = nd;
			}
			if(g_tNode == null) {
				return;	
			}
			_this.isdrag = true; 
			_this.dragWnd = g_tNode.cloneNode(true);
			g_tNode.parentNode.insertBefore(_this.dragWnd, g_tNode);
			_this.dragWnd.style.position = 'absolute';
			_this.dragWnd.style.filter = 'alpha(opacity=70)';
			_this.dragWnd.style.zIndex = '1000';
			//_this.dragWnd = oDragHandle.cloneNode(true);
			$dragManage.setdragWnd(oDragHandle);	// ָ��ѡ���϶���Ԫ��
			_this.dragWnd.attachEvent('onblur', _releaseMouse);

			// ��ʼ��ʱ�����ָ��styled������ֵ����Ϊ�գ�������offsetLeft����ֱ�ӻ�ó�ʼ����ֵ
			_this.stX = oDragHandle.offsetLeft + 0;
			_this.stY = oDragHandle.offsetTop + 0;			
			_this.x = _this.nn6 ? e.clientX : event.clientX;
			_this.y = _this.nn6 ? e.clientY : event.clientY; 
			document.attachEvent('onmousemove', _moveMouse); 
			return false;
		}
	};
		
	function _moveMouse(e) {
		var wndNode = _this.dragWnd;
		if ( _this.isdrag ) {
			var x = (_this.nn6?(_this.stX+e.clientX-_this.x):(_this.stX+event.clientX-_this.x));
			var y = (_this.nn6?(_this.stY+e.clientY-_this.y):(_this.stY+event.clientY-_this.y));
			wndNode.style.left = x;
			wndNode.style.top = y;
			if(typeof _this.dragWnd.onmove == 'function') {
				_this.dragWnd.onmove();
			}
			return false; 
		}
	};
	
	function _releaseMouse() {
		_this.isdrag=false;
		if(_this.dragWnd) {
			if(typeof _this.dragWnd.parentNode.onup == 'function') {
				_this.dragWnd.parentNode.onup();
			}
			
			if( _this.dragWnd.parentNode.withshape)
				_this.dragWnd.parentNode.removeChild(_this.dragWnd);
		}
	};
	// do initialize
	document.attachEvent('onmousedown', _initdragment); 
	document.attachEvent('onmouseup', _releaseMouse);	//$SaveRectForWindow(_this.dragWnd);
	window.attachEvent('onblur', _releaseMouse);
})();