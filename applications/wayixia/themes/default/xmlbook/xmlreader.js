/*--------------------------------------------------------------------------------
 $ 类名：XMLBOOK Reader
 $ 功能：读取xml book并显示
 $ 日期：2008-12-14 23:57
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://onlyaa.com] All rights reservered.
----------------------------------------------------------------------------------*/

var __xmlBookL = Q.KLASS();
__xmlBookL.prototype = {
    tplInstance : null,
    hwnd : null,    // 窗口Table
    wndTitle : null,
    wndIconMenus  : null,
    wndMenusBar : null,
    wndFrameLeft : null,
    wndFrameRight : null,
    wndWorkSpace : null,
    searchWnd : null,  
    workspace : null,
    property : null,
    // ctrl
    tree : null,
    ctlURL : null,
    dlgFile : null,
    xmlBookHandler : null,
	ajaxApi : null,
    _initialize : function(parentWnd, ajaxApi, fileName) {
        _this = this;

		_this.ajaxApi = ajaxApi;
        //get html elements
        _this.hwnd      = document.getElementById('frame');
        _this.wndTitle  = document.getElementById('header_title');
        _this.wndIconMenus   = document.getElementById('header_menus');
        _this.wndMenusBar  = document.getElementById('menusbar')
        _this.wndFrameLeft   = document.getElementById('frame_left');
        _this.wndFrameRight  = document.getElementById('frame_right');
        _this.wndWorkSpace = document.getElementById('workspace');
        
        // disabled select and drag
        _this.wndTitle.onselectstart = function(){return false;}
        _this.wndIconMenus.onselectstart = function(){return false;}
        _this.wndMenusBar.onselectstart = function(){return false;}
        //!expand
        var btnExpand = CButton('IDC_EXPAND', '<<');
		_this.wndMenusBar.appendChild(btnExpand);
		btnExpand.isClosed = false;
		btnExpand.onclick = function() {
			if( this.isClosed ) {
				this.innerText = '<<';
				_this.wndFrameLeft.style.display = '';
			} else {
				this.innerText = '>>';
				_this.wndFrameLeft.style.display = 'none';
			}
			this.isClosed = !this.isClosed;
		}
        
        var btnOpen = CButton('IDC_OPEN', '打开(O)');
		_this.wndMenusBar.appendChild(btnOpen);
		btnOpen.onclick = function() {_this.open();}
		
		var btnFavorites = CButton('IDC_FAVOR', '收藏夹(O)');
		_this.wndMenusBar.appendChild(btnFavorites);
		
		var btnHelp = CButton('IDC_HELP', '帮助(O)');
		_this.wndMenusBar.appendChild(btnHelp);
        btnHelp.onclick = function() { MENU_Help(_this); }
		
        //! 加载资源
        // initial template instance
        var tfile = Q.libDir()+'/res/templates.xml';
        _this.tplInstance = Q.TemplatesFactory.createTemplate(tfile);
		
		$LoadResource(tfile);
		// 载入全局资源
		//__GLOBALS['templatesHandle'] = ITemplatesFactory.createTemplate(tfile);
        
		if(fileName) {
    		// _this.getBookHandler().createFromFileQ.XMLFile(fileName);
			if(fileName.indexOf('http') > -1) {
				if(_this.getBookHandler().createFromFile(fileName)) {
					_this.render();
				}
			} else {
				_this.loadAjaxFile(fileName);
			}
		} else {
			//_this.tree = new __simpleTreeL(_this.wndFrameLeft, '未打开任何文档', true);
			//_this.tree.setItemIcon(0, 'treeIconFolder');
			_this.render();
		}
    },
    
    
    open : function() {
		var _this = this;
        Q.FileDialog({
			App : 'xmlbook',
			Extension: 'xml',
			OnOK : function(fName) { 
				//_this.loadfile(fName);
				_this.loadAjaxFile(fName);
				return true;
			},
			OnCancel : function() { return true; }
		});
    },

	getBookHandler : function() {
		if(!this.bookHandler) {
			this.bookHandler = new XMLBOOKDocument();
		}

		return this.bookHandler;
	},

	loadAjaxFile : function(fName) {
		var _this = this;
		Q.Ajax({
			command: _this.ajaxApi + '&action=read',
			data : { fName : fName },
			oncomplete : function(xmlhttp) {
				// alert(xmlhttp.responseText);
				//try {
					var r = eval('('+xmlhttp.responseText+')');
					if(r.header != 0) {
						alert(r.data);
					} else {
						var bResult = _this.getBookHandler().createFromBuffer(r.data)
						if(bResult) {
							if( _this.tree ) { _this.tree = null; }
							_this.render();
						} else {
							throw new String("无效的XMLBOOK文档");
						}
						
					}
				//}catch (e){
				//	alert("错误:"+e.description+"\r\n"+xmlhttp.responseText);
				//}
			},
			onerror : function(xmlhttp) {}
		});
	},
    
    render : function() {
    	var _this = this;
    	_this.wndFrameLeft.innerHTML = '';   // 清空窗口内容;
		var bookName = _this.getBookHandler().getName();
		_this.tree = new __simpleTreeL({
			Render: _this.wndFrameLeft,
			Name : bookName,
			IsOpen : true,
		});
		_this.tree.itemClick = function(nItem) {
			var page = this.getItemData(nItem);
			if(page) {
				_this.pageview(page);
			}
		}
		_this.tree.contextmenu = function(nItem) {
			//LoadMenu(_this, 'xmlbook_item');
			//__GLOBALS['contextmenu'].show();
		}
		var fullName = bookName+'';
		if( (bookName+'').length > 50 ) {
			bookName = '<font title="'+fullName+'">' + bookName.substr(0, 50) + '...</font>';
		}
		//_this.wndTitle.innerHTML = '&nbsp;☆书名: ' + bookName;
		//document.title = bookName + ' - XML Book Reader Powered By ONLYAA.COM';
		// initial Tree ctrl width data
        _this.tree.setItemData(0, _this.bookHandler.getBookNode());
        loadpages(0, _this.bookHandler.getPagesNode(), _this.tree);	
    },
    
    pageview : function(page) {
        var _this = this;
        pageview(page, _this.wndWorkSpace)
		_this.onpageview(page);
    },

	onpageview : function(page) {
	
	},
}


function pageview(page, view) {
	if(page) {
		var P = new XMLBOOKPage(page);
		if(P.isValid()) {
			view.innerHTML = '<b>' + P.getTitle() + '<\/b><br>' + P.getContext();
		}		
	}
}

function loadpages(parentIdx, parentPages, tree) {
    var pages = parentPages.childNodes;   // 获得子节点
    // load sub pages
    var len = pages.length;
    for(var i = 0; i < len; i++) {
        var page = pages[i];
        if(page.tagName != 'PAGE') { continue; }

		var P = new XMLBOOKPage(page);
        var nItem = tree.createNode(parentIdx, P.getTitle(), false);
        tree.setItemData(nItem, page);    // 将PageNode邦定到该节点中
        var subpages = P.getPages();
        if(subpages) {
            loadpages(nItem, subpages, tree);
        }
    }
}

function MENU_Help(_this) {
        if( $IsWindow($GetWindow(_this.dlgHelp) ) ) {
            return;
        } else {
            _this.dlgHelp = new __DIALOG('HelpDoc', null);
            var hwnd = $GetWindow(_this.dlgHelp);
            $SetTitleText(hwnd, '帮助文档 - XMLBook Reader Powered By ONLYAA.COM')
            $GetClient(hwnd).innerHTML = _this.tplInstance.load('HelpDoc');
            _this.dlgHelp.doModal();
            $FitWindow(hwnd);
            $CenterWindow(hwnd);
            
            // load tree
			var xmlHelpDoc = new XMLBOOKDocument();
			var bResult = xmlHelpDoc.createFromFile(Q.libDir()+'/res/help.xml');
			
            if(!bResult) {
                msgbox('帮助文档: \r\n不存在或者已经被删除！');
                $EndDialog(_this.dlgHelp);
                return;
            }
            
			var bookName = xmlHelpDoc.getName();
			if(bookName == '') {
				bookName = 'About Help Contents';
			}

            var tree = new __simpleTreeL({ 	
				Render : document.getElementById('DirX'), 
				Name : bookName,
				IsOpen : true, 
			});

            tree.itemClick = function(nItem) {
                var page = this.getItemData(nItem);
                if(page) {
                    pageview(page, pageViewX);
                }
            }

            var pages = xmlHelpDoc.getPagesNode();   //xmlDoc.selectSingleNode(XQL);
            // initial tree ctrl
            if(pages)
                loadpages(0, pages, tree);
        }
}
