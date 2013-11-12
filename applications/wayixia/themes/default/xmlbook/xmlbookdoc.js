/*--------------------------------------------------------------------------------
 $ 类名：XMLBOOKDocument
 $ 功能：原本用XMLDocument文件处理xmlbook, 现在新增了XMLBookDocument类, 专门处理
 $ xmlbook. 主要目的是将大部分xml操作封装起来, 在编辑器中用一个bookHandle实例提供所有接口.
 $ 日期：2008-12-14 23:57
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://onlyaa.com] All rights reservered.
----------------------------------------------------------------------------------*/

// XMLBook 章节操作
var XMLBOOKPage = Q.KLASS();
XMLBOOKPage.prototype = {

	pageNode : null,
	titleNode : null,
	contextNode : null,
	pagesNode : null,

	_initialize : function(Node) {
		var _this = this; 
		Node&&_this.attachFromPage(Node);
	},

	// 从已有节点构造章节对象
	attachFromPage : function(pageNode) {
		var _this = this;
		_this.pageNode = null;
		_this.titleNode = null;
		_this.contextNode = null;
		_this.pagesNode = null;

		if(!pageNode || (pageNode.nodeName != 'PAGE')) {
			// alert('无效的章节点.');
			return false;
		}
		
		_this.pageNode = pageNode;

		// 标题
		var titleNode = pageNode.selectSingleNode('TITLE');
		if(!titleNode) {
			_this.titleNode = _this.getDocument().createElement('TITLE');
			_this.pageNode.appendChild(_this.titleNode);
			_this.setTitle('');
		} else {
			_this.titleNode = titleNode;
		}
		
		var contextNode = pageNode.selectSingleNode('CONTEXT');
		if(!contextNode) {
			_this.contextNode = _this.getDocument().createElement('CONTEXT');
			_this.pageNode.appendChild(_this.contextNode);
			_this.setContext('');
		} else {
			_this.contextNode = contextNode;
		}
		
		var pagesNode = pageNode.selectSingleNode('PAGES');
		if(!pagesNode) {
			_this.pagesNode = _this.getDocument().createElement('PAGES');
			_this.pageNode.appendChild(_this.pagesNode);
		} else {
			_this.pagesNode = pagesNode;
		}

		return true;
	},

	// 从#document中构造新的章节
	createFromDocument : function(xmlDoc, attrs) {
		var _this=this;
		_this.pageNode = xmlDoc.createElement('PAGE');
    	_this.titleNode = xmlDoc.createElement('TITLE');
    	_this.contextNode = xmlDoc.createElement('CONTEXT');
		_this.pagesNode = xmlDoc.createElement('PAGES');
    	_this.pageNode.appendChild(_this.titleNode);
    	_this.pageNode.appendChild(_this.contextNode);
		_this.pageNode.appendChild(_this.pagesNode);

		// 设置节点内容
		if(attrs) {
			if(attrs.title) { _this.setTitle(attrs.title); }
			if(attrs.context) {	_this.setContext(attrs.context); }
		}
	},

	// 设置章节标题
	setTitle : function(title) {
		var _this = this;
		// 清除子节点		
		var textNode = _this.getDocument().createTextNode(title+'');
		_this.clearChildren(_this.titleNode);
		_this.titleNode.appendChild(textNode);
	},

	// 设置章节内容
	setContext : function(context) {
		var _this = this;
		var cdata = _this.getDocument().createCDATASection(context+'');
		_this.clearChildren(_this.contextNode);
        _this.contextNode.appendChild(cdata);
	},


	// 添加子章节
	appendChildPage : function(childPage) {
		var _this = this;
		//var NewNode = childPage.getPageNode();
		//var removeNode = NewNode.parentNode.removeChild(NewNode);
		_this.pagesNode.appendChild(childPage);
	},
	
	insertBefore : function(page) {
		var Node = this.getPageNode();
		var NewNode = page.getPageNode();
		var removeNode = NewNode.parentNode.removeChild(NewNode);
		Node.parentNode.insertBefore(removeNode, Node);
	}, 

	insertAfter : function(page) {
		var Node = this.getPageNode();
		var NewNode = page.getPageNode();
		var removeNode = NewNode.parentNode.removeChild(NewNode);
		if(Node.parentNode.lastChild == Node) {
			Node.parentNode.appendChild(removeNode);
		} else {
			Node.parentNode.insertBefore(removeNode, Node.nextSibling);
		}
	},
	
	// 删除子章节
	removeChildPage : function(childPage) {
		var _this = this;
		_this.pagesNode.removeChild(childPage);
	},

	// 清除node的所有子节点
	clearChildren : function(node) {
		if(node.firstChild) {
			var child = node.firstChild;
			while(child) {
				var tChild = child;
				node.removeChild(tChild);
				child = child.nextSibling;
			}
		}
	},

	// 获得文档对象
	getDocument : function() {
		var _this = this;
		if(!_this.pageNode) {
			alert('章节还没有初始化！');
			return null;
		}
		
		return _this.pageNode.ownerDocument;
	},

	// 获得章节点DOM对象
	getPageNode : function() {
		return this.pageNode;
	},

	// 获得章节标题
	getTitle : function() {
		var _this = this;
		if(!_this.titleNode.firstChild ) {
			return '';
		}
		return _this.titleNode.firstChild.nodeValue;
	},
	
	// 获得章节内容
	getContext : function() {
		var _this = this;
		if(!_this.contextNode.firstChild ) {
			return '';
		}
		return _this.contextNode.firstChild.nodeValue;
	},

	// 获得子章节
	getPages : function() {
		return this.pagesNode;
	},

	isValid : function() { return (this.pageNode); }
};

// XMLBOOK Document文档管理对象
var XMLBOOKDocument = Q.KLASS();
XMLBOOKDocument.prototype = {
	bookNode : null,
	nameNode : null,
	authorNode : null,
	pressNode : null,
	forwardNode : null,
	desciptNode : null,
	pagesNode : null,

	// 初始化
	_initialize : function() {
		var _this = this;
		var xmlDoc = Q.XML('<XMLBOOK></XMLBOOK>');
		_this.attachFromDocument(xmlDoc);
	},

	attachFromDocument : function(xmlDoc) {
		var _this = this;
		if(xmlDoc == null) { return false; }
		var rootElement = xmlDoc.documentElement;
		if(rootElement.nodeName != 'XMLBOOK') {
			// alert('无效的XMLBOOK文档!');
			return false;
		}

		// 初始化XMLBOOK
		_this.bookNode = rootElement;

		// 书籍名称
		var nameNode = rootElement.selectSingleNode('BOOKNAME');
		if(!nameNode) {
			_this.nameNode = xmlDoc.createElement('BOOKNAME');
			_this.bookNode.appendChild(_this.nameNode);
		} else {
			_this.nameNode = nameNode;
		}
		
		// 书籍作者
		var authorNode = rootElement.selectSingleNode('AUTHOR');
		if(!authorNode) {
			_this.authorNode = xmlDoc.createElement('AUTHOR');
			_this.bookNode.appendChild(_this.authorNode);
		} else {
			_this.authorNode = authorNode;
		}
		
		// 出版社
		var pressNode = rootElement.selectSingleNode('PRESS');
		if(!pressNode) {
			_this.pressNode = xmlDoc.createElement('PRESS');
			_this.bookNode.appendChild(_this.pressNode);
		} else {
			_this.pressNode = pressNode;
		}

		// 前言
		var forwardNode = rootElement.selectSingleNode('FORWARD');
		if(!forwardNode) {
			_this.forwardNode = xmlDoc.createElement('FORWARD');
			_this.bookNode.appendChild(_this.forwardNode);
		} else {
			_this.forwardNode = forwardNode;
		}

		// 内容简介
		var descriptNode = rootElement.selectSingleNode('DESCRIPTION');
		if(!descriptNode) {
			_this.descriptNode = xmlDoc.createElement('DESCRIPTION');
			_this.bookNode.appendChild(_this.descriptNode);
		} else {
			_this.descriptNode = descriptNode;
		}


		var pagesNode = rootElement.selectSingleNode('PAGES');
		if(!pagesNode) {
			_this.pagesNode = xmlDoc.createElement('PAGES');
			_this.bookNode.appendChild(_this.pagesNode);
		} else {
			_this.pagesNode = pagesNode;
		}

		return true;		
	},

	// 从缓存中创建XMLBook
	createFromBuffer : function(xmlString) {

		// 加载XMLBook文档
		return this.attachFromDocument(Q.XML(xmlString));
	},

	// 从文件中创建XMLBook
	createFromFile : function(sFile) {
		return this.attachFromDocument(Q.XMLFile(sFile));
	},

	clearDocument : function() {},

	createPage : function(parentNode, title) {
    	var _this = this;
		var P = new XMLBOOKPage();
		P.createFromDocument(_this.getDocument());
		P.setTitle(title);
		if(parentNode && (parentNode != _this.getBookNode())) {
			var ParentPage = new XMLBOOKPage(parentNode);
			ParentPage.appendChildPage(P.getPageNode());
		} else {
			_this.pagesNode.appendChild(P.getPageNode());
		}	

		return P.getPageNode();
    },    

	getName : function() {
		var _this = this;
		if(_this.nameNode.firstChild) {
			return _this.nameNode.firstChild.nodeValue;
		} else {
			return '';
		}
	},

	getAuthor : function() {
		var _this = this;
		if(_this.authorNode.firstChild) {
			return _this.authorNode.firstChild.nodeValue;
		} else {
			return '';
		}
	},
	

	getPress : function() {
		var _this = this;
		if(_this.pressNode.firstChild) {
			return _this.pressNode.firstChild.nodeValue;
		} else {
			return '';
		}
	},

	getForward : function() {
		var _this = this;
		if(_this.forwardNode.firstChild) {
			return _this.forwardNode.firstChild.nodeValue;
		} else {
			return '';
		}
	},

	getDescript : function() {
		var _this = this;
		if(_this.descriptNode.firstChild) {
			return _this.descriptNode.firstChild.nodeValue;
		} else {
			return '';
		}
	},


	getDocument : function() { return this.bookNode.ownerDocument;	},

	getBookNode : function() { return this.bookNode; },

	getPagesNode : function() { return this.pagesNode; },


	// set
	setName : function(name) {
		var _this = this;
		// 清除子节点		
		var textNode = _this.getDocument().createTextNode(name+'');
		_this.clearChildren(_this.nameNode);
		_this.nameNode.appendChild(textNode);
	},

	setAuthor : function(author) {
		var _this = this;
		var textNode = _this.getDocument().createTextNode(author+'');
		_this.clearChildren(_this.authorNode);
		_this.authorNode.appendChild(textNode);
	},

	setPress : function(press) {
		var _this = this;
		var textNode = _this.getDocument().createTextNode(press+'');
		_this.clearChildren(_this.pressNode);
		_this.pressNode.appendChild(textNode);
	},

	setForward : function(forward) {
		var _this = this;
		var textNode = _this.getDocument().createTextNode(forward+'');
		_this.clearChildren(_this.forwardNode);
		_this.forwardNode.appendChild(textNode);
	},

	setDescript : function(descript) {
		var _this = this;
		var textNode = _this.getDocument().createTextNode(descript+'');
		_this.clearChildren(_this.descriptNode);
		_this.descriptNode.appendChild(textNode);
	},

	// 清除node的所有子节点
	clearChildren : function(node) {
		if(node.firstChild) {
			var child = node.firstChild;
			while(child) {
				var tChild = child;
				node.removeChild(tChild);
				child = child.nextSibling;
			}
		}
	},
		
	// 返回XML格式的字符串
	save : function() {
		var _this = this;
		if(window.ActiveXObject) {
			//if the browser is IE
			return _this.getDocument().xml;
		} else {
			//the browser is not IE
			var oSerializer=new XMLSerializer();//new object XMLSerializer
			return oSerializer.serializeToString(_this.getDocument(),'text/xml');   
		}
		return '';
	},

	isValid : function() {
		return true;
	}
};