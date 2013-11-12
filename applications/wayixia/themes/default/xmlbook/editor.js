
// 必须要放到首行执行
//var dir = Q.__DIR__();


var MANAGE_EDIT = 'e';      // 编辑
var MANAGE_DELETE = 'd';    // 删除
var MANAGE_CREATE = 'c';    // 新建
var BOOK_TEMPLATES = 'res/templates_book.xml';

function exit() { window.close(); }

function msgbox(msg, pParentWnd) {
	Q.MsgBox('错误提示: ', msg, MSGBOX_YES, {}, pParentWnd);
}

function action2str(action) {
    var str = '';
    if(action == MANAGE_CREATE) {
        str = '新建';   
    } else if(action == MANAGE_EDIT) {
        str = '编辑';   
    } else if(action == MANAGE_DELETE) {
        str = '删除';   
    }
    return str;
}

var __xmlBookEditorL = Q.KLASS();
    __xmlBookEditorL.prototype = {
	__DIR__ :  Q.__DIR__(),
    version : '1.1.20081220',
    bInited : false,
    hwnd : null,    // 窗口Table
    wndTitle : null,
    wndIconMenus  : null,
    wndMenusBar : null,
    wndFrameLeft : null,
    wndFrameRight : null,
    wndWorkSpace : null,
    searchWnd : null,  
    workspace : null,

    // data 
    editingpage : null, // 正在编辑的节点
    configure : null,
    configFileHandle : null,
    bookHandler: null,
    tmpInstance : null,
    // dlg and windows
    dlgPageManage : null,
    dlgNewNode : null,
    dlgSettings : null,
    dlgHelp : null,
    dlgFile : null,
    dlgBookManage : null,
    ctlURL : null,

    tree : null,
    loaded : false,
    iframeHandle : null,
    fckHandle : null,
    fckInstance : null,
	menubook : null,
	menupage : null,
	_AjaxApi : null,
	_fileName : null,
    _initialize : function(parentWnd, ajaxApi) {
        _this = this;
		_this._AjaxApi = ajaxApi;
		_this._fileName = 'xmlbook.xml';
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
		
		var btnNewBook = new CButton('IDC_OPEN', '新增项目(N)');
        _this.wndMenusBar.appendChild(btnNewBook);
        btnNewBook.onclick = function() {
            MENU_BookManage(_this, MANAGE_CREATE);  
        }
        
        //var btnSettings = new CButton('IDC_SETTINGS', '配置(S)');
        // _this.wndMenusBar.appendChild(btnSettings);
        //btnSettings.onclick = function() {
        //    MENU_Settings(_this);   
        //}
        
        //var btnFavorites = new CButton('IDC_FAVOR', '收藏夹(F)');
        //_this.wndMenusBar.appendChild(btnFavorites);
        //btnFavorites.onclick = function() {
        //    //msgbox('功能正在开发ing...')   
		//	_this.menupage.showElement(this);
        //}

		var btnHelp = CButton('IDC_HELP', '帮助(O)');
		_this.wndMenusBar.appendChild(btnHelp);
        btnHelp.onclick = function() { MENU_Help(_this); }
		
        //! 加载资源
        // initial template instance
        var tfile = Q.libDir()+'/res/templates.xml';
		$LoadResource(tfile);
        _this.tplInstance = Q.TemplatesFactory.createTemplate(tfile);

        // initial Tree ctrl
		// _this.tree = new __simpleTreeL(_this.wndFrameLeft, '空文档项目', true);
        _this.tree = new __simpleTreeL({
			Render : _this.wndFrameLeft,
			Name : '空文档项目',
			IsOpen : true,
		});
		
        _this.configure = tfile = _this.__DIR__+'/res/configure.xml';
        _this.configFileHandle = Q.XMLFile(_this.configure);
		
		// 创建菜单
		_this._createMenu();

        if(! _this.configFileHandle) {
            $MessageBox('应用程序出错', '配置文件加载出错，请检查文件\r\n['+_this.configure+']\r\n是否存在或者被损坏！确认后再刷新或者重启程序.', null, {
                onok : exit 
            });
            return;
        }
        _this.bInited = true;
    },

	_createMenu : function() {
		var _this = this;
		// 创建右键菜单
		_this.menubook = new class_menu();
		var m1 = new class_menuitem({
			text: "书籍设置",
			icon: "hmenu-asc.gif",
			callback : function(menuitem) {
				MENU_BookManage_Edit(_this);
			}
		});

		var m2 = new class_menuitem({
			text: "新增文档", 
			icon: "hmenu-desc.gif",
			callback : function(menuitem) {
				MENU_PageManage(_this, MANAGE_CREATE);
			}
		});

		//var m3 = new class_menuitem({type: MENU_SEPERATOR, text: ""});
		//var m4 = new class_menuitem({text: "属性", icon: 'columns.gif'});
		_this.menubook.addMenuItem(m1);
		_this.menubook.addMenuItem(m2);
		//_this.menubook.addMenuItem(m3);
		//_this.menubook.addMenuItem(m4);

		// menu page
		_this.menupage = new class_menu();
		var m11 = new class_menuitem({
			text: "新增文档", 
			icon: "hmenu-asc.gif",
			callback : function(menuitem) {
				MENU_AddPage(_this);
			}
		});
		
		var m12 = new class_menuitem({
			text: "编辑", 
			icon: "hmenu-desc.gif",
			callback : function(menuitem) {
				MENU_Edit(_this);
			}
		});
		var m13 = new class_menuitem({
			text: "重命名",
			icon: "hmenu-asc.gif",
			callback : function(menuitem) {
				MENU_ReName(_this);
			}
		});
		var m14 = new class_menuitem({
			text: "删除",
			icon: "hmenu-desc.gif",
			callback : function(menuitem) {
				MENU_Delete(_this);
			}
		});
		
		//var m15 = new class_menuitem({type: MENU_SEPERATOR, text: ""});
		//var m16 = new class_menuitem({text: "属性", icon: 'columns.gif'});

		_this.menupage.addMenuItem(m11);
		_this.menupage.addMenuItem(m12);
		_this.menupage.addMenuItem(m13);
		_this.menupage.addMenuItem(m14);
		//_this.menupage.addMenuItem(m15);
		//_this.menupage.addMenuItem(m16);

		_this.menubook.hide();
		_this.menupage.hide();
	},
     
    getBookHandler : function() {
		if(!this.bookHandler) {
			this.bookHandler = new XMLBOOKDocument();
		}

		return this.bookHandler;
	},

    createNewBook : function() {
        MENU_CreateNewBook(this);
    },

    pageedit : function(page) {
        var _this = this;
		var b = (_this.editingpage != page);
        if(_this.editingpage 
			&& (_this.editingpage != page) 
			&& (_this.pageIsChanged(_this.editingpage)))
		{
            $MessageBox('文档保存', '是否保存该文档', MSGBOX_YESNOCANCEL, {
                onok : function() {
                    _this.pageInit(page, true);
                },
                onno : function() {
                     _this.pageInit(page, false);
                }
            })
        } else {
			 _this.pageInit(page, false);
		}
    },

	pageInit : function(page, isNeedSave) {
		var _this = this;
		isNeedSave && _this.pagesave();
		_this.editingpage = page;
		var P = new XMLBOOKPage(page);
        _this.fckInstance.SetHTML(P.getContext());
	},

    pagesave : function() {
        var _this = this;
        if(_this.editingpage == null) {
            msgbox('当前无任何编辑章节或者还没有创建书籍项目');
            return;
        }

		var P = new XMLBOOKPage(_this.editingpage);
		P.setContext(_this.fckInstance.GetHTML());
        _this.save();

    },

	pageIsChanged : function(page) {
		var P = new XMLBOOKPage(page);
		var context = P.getContext();
		return (context != _this.fckInstance.GetHTML());
	},


    save : function(){
        var _this = this;
        var xml = _this.bookHandler.save();
		Q.Ajax({
			command: _this._AjaxApi + '&action=save',
			data : {fName: _this._fileName, fData: xml},
			oncomplete : function(xmlhttp) {
				try	{
					var r = eval('('+xmlhttp.responseText+')');
					if(r.header != 0) {
						alert(r.data);
					} else {
						msgbox('保存成功');
						//_this.bookHandler.loadXML(r.data)
						//_this.render();
					}
				} catch (e) {
					//msgbox("错误提示:"+e + "\r\n" + xmlhttp.responseText);
					alert(xmlhttp.responseText);
				}
			}
		});
    },

	open : function() {
		var _this = this;
        Q.FileDialog({
			App : 'xmlbook',
			Extension: 'xml',
			OnOK : function(fName) { 
				_this._fileName = fName;
				//_this.loadfile(fName);
				_this.loadAjaxFile(fName);
				return true;
			},

			OnCancel : function() {
				return true;
			}
		});
    },

	loadAjaxFile : function(fName) {
		var _this = this;
		Q.Ajax({
			command: _this._AjaxApi + '&action=read',
			data : { fName : fName },
			oncomplete : function(xmlhttp) {
				// alert(xmlhttp.responseText);
				try {
					var r = eval('('+xmlhttp.responseText+')');
					if(r.header != 0) {
						alert(r.data);
					} else {
						var bResult = _this.getBookHandler().createFromBuffer(r.data)
						if(bResult) {
							_this.render();
						} else {
							throw new String("无效的XMLBOOK文档");
						}
					}
				}catch (e){
					msgbox("错误:"+e.description+"\r\n"+xmlhttp.responseText);
				}
			},
			onerror : function(xmlhttp) {}
		});
	},

	onItemAccept : function(tree, srcid, targetid, dragtype) {
		var srcPage = new XMLBOOKPage(tree.getItemData(srcid));
		var targPage = new XMLBOOKPage(tree.getItemData(targetid));
		
        if(dragtype == TREEITEM_DRAG_CENTER) {
            tree.appendChild(srcid, targetid);
			targPage.appendChildPage(srcPage.getPageNode());
        } else if(dragtype == TREEITEM_DRAG_TOP) {
			tree.insertBefore(srcid, targetid);
			targPage.insertBefore(srcPage);
		} else if(dragtype == TREEITEM_DRAG_BOTTOM) {
			tree.insertAfter(srcid, targetid);
			targPage.insertAfter(srcPage);
		}
	},

	render : function() {
		var _this = this;
		_this.wndFrameLeft.innerHTML = '';   // 清空窗口内容;
        // initialize root Node;
        _this.tree = null;
        _this.tree = new __simpleTreeL({
			Render : _this.wndFrameLeft, 
			Name : _this.bookHandler.getName(), 
			IsOpen : true,
			Acceptable : true,
			onItemAccept : function(srcid, targetid, dragtype) { 
					_this.onItemAccept(this, srcid, targetid, dragtype);
			},
		});
        _this.tree.itemDblClick = function(nItem) {
            if( this.selected == 0 ) {
                MENU_BookManage_Edit(_this);
            } else {
                var page = this.getItemData(nItem);
                if(page) { _this.pageedit(page); }
            }
        }
        _this.tree.contextmenu = function(nItem) {
			_this.tree.setItemSelected(nItem);
            if( this.selected == 0 ) {
                //LoadMenu(_this, 'xmlbook_book');
                //_this.menupage.hide();
				_this.menubook.show();
            } else {
                //LoadMenu(_this, 'xmlbook_item');
                //_this.menubook.hide();
				_this.menupage.show();
            }
        }
        _this.tree.onNodeDelete = function(nItem) {
            if(nItem == 0) {
                $MessageBox('删除书籍', '暂时不提供删除书籍功能!', MSGBOX_YES, {});
                return false;
            }
            MENU_Delete(_this);
            return false;
        }
        // initial Tree ctrl width data
        _this.tree.setItemData(0, _this.bookHandler.getBookNode());
        loadpages(0, _this.bookHandler.getPagesNode(), _this.tree);	
	},
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

function pageview(page, view) {
	if(page) {
		var P = new XMLBOOKPage(page);
		view.innerHTML = '<b>' + P.getTitle() + '<\/b><br>' + P.getContext();
	}
}

function MENU_PageManage(_this, action) {
    if( !_this.bookHandler ) {
        msgbox('还没有创建或者加载项目!');
        return; 
    }

	// 如果对话框不存在则创建
    if(!$IsWindow($GetWindow(_this.dlgPageManage)) ) {
        _this.dlgPageManage = new __DIALOG('RenamePage', null);
        var hwnd = $GetWindow(_this.dlgPageManage);
        var szAction = action2str(action)
        if(action == MANAGE_EDIT) {
            szAction = '重新命名';
        }
        $SetTitleText(hwnd, szAction + ' - XMLBook Editor Powered By QLibs.COM')
		_this.dlgPageManage.doModal();
        $CenterWindow(hwnd);
		// do data exchange
		_this.dlgPageManage.name        = new __DDXITEM('PA_NAME', _this.dlgPageManage.DataExchanger);
    }

	if( action == MANAGE_EDIT ) {
		_this.dlgPageManage.name.set(_this.tree.getItemText(_this.tree.selected))
		_this.dlgPageManage.UpdateData(false);
    }

	_this.dlgPageManage.addBottomButton(' 确 认 ', 'sysbtn', function() {
		_this.dlgPageManage.UpdateData(true);
		var szName = _this.dlgPageManage.name.toString();
		if( szName == '' ) {
			msgbox('输入名称不能为空!');
			return;
		}
		if(action == MANAGE_EDIT) {
			_this.tree.setItemText(_this.tree.selected, szName);
			var pageNode = _this.tree.getItemData(_this.tree.selected);
			
			var P = new XMLBOOKPage(pageNode);
			P.setTitle(szName);
			_this.save(true);
			// 如果当前重命名节点为当前正在编辑节点，则将重命名的名称更新到编辑器标题中
			//if(pageNode == _this.editingpage) {
			//   var editorDocCollection = document.frames(_this.name).document.all;
			//   editorDocCollection.bookTitleContainer.innerText = szName;
			//}
		} else if(action ==  MANAGE_CREATE) {
			var pageNode = _this.tree.getItemData(_this.tree.selected);
			var idx = _this.tree.createNode(_this.tree.selected, szName, true, true);
			//alert(pageNode)
			var newPage = _this.bookHandler.createPage(pageNode, szName);
			_this.tree.setItemData(idx, newPage);   // 邦定Node和PageNode
			_this.save(true);
		}
		$EndDialog(_this.dlgPageManage);
    });   
}

function MENU_ReName(_this) {
    MENU_PageManage(_this, MANAGE_EDIT);
}

function MENU_BookManage_Edit(_this) {
    MENU_BookManage(_this, MANAGE_EDIT);    
}

function MENU_BookManage(_this, action) {
	// 如果对话框不存在则创建
    if(!$IsWindow($GetWindow(_this.dlgBookManage)) ) {
        _this.dlgBookManage = new __DIALOG('BookManage', null);
        var hwnd = $GetWindow(_this.dlgBookManage);
        $SetTitleText(hwnd, '书籍设置 - XMLBook Editor Powered By ONLYAA.COM');
        _this.dlgBookManage.doModal();
        $ResizeTo(hwnd, 500, 400);
        $CenterWindow(hwnd);
		// do data exchange
		_this.dlgBookManage.name        = new __DDXITEM('BOOK_NAME', _this.dlgBookManage.DataExchanger);
		_this.dlgBookManage.author      = new __DDXITEM('BOOK_AUTHOR', _this.dlgBookManage.DataExchanger);
		_this.dlgBookManage.press       = new __DDXITEM('BOOK_PRESS', _this.dlgBookManage.DataExchanger);
		_this.dlgBookManage.forward     = new __DDXITEM('BOOK_FORWORD', _this.dlgBookManage.DataExchanger);
		_this.dlgBookManage.description = new __DDXITEM('BOOK_DESCRIPTION', _this.dlgBookManage.DataExchanger);
    }

    if(action == MANAGE_EDIT) {
		_this.dlgBookManage.name.set(_this.getBookHandler().getName());
		_this.dlgBookManage.author.set(_this.getBookHandler().getAuthor());
		_this.dlgBookManage.press.set(_this.getBookHandler().getPress());
		_this.dlgBookManage.forward.set(_this.getBookHandler().getForward());
		_this.dlgBookManage.description.set(_this.getBookHandler().getDescript());
		_this.dlgBookManage.UpdateData(false);
    } else if(action == MANAGE_DELETE) {
		alert('delete');
	}
        
	_this.dlgBookManage.addBottomButton(' 确 认 ', 'sysbtn', function() {
		// 获取界面数据
		_this.dlgBookManage.UpdateData(true);
		var name        = _this.dlgBookManage.name.toString();
		var author      = _this.dlgBookManage.author.toString();
		var forward     = _this.dlgBookManage.forward.toString();
		var description = _this.dlgBookManage.description.toString();
		var press       = _this.dlgBookManage.press.toString();

		// 数据校验
		if(name == '' || author == '' ) {
			msgbox('书名称和作者不能为空！',$GetWindow(_this.dlgBookManage));
			return; 
		}
                
		if( action == MANAGE_CREATE ) {
			var f = name.split('.');
			var filter = '.' + (f.length > 1) ? f[f.length-1] : 'xml';
			Q.FileDialog({
				ParentWnd : $GetWindow(_this.dlgBookManage),
				Type : 'saveas',
				App : 'xmlbook',
				Extension: '.xml|.txt',
				OnOK : function(fileName) {
					_this._fileName = fileName;
					// create new book
					var tplFile = _this.__DIR__+'/'+unescape(BOOK_TEMPLATES);
					_this.getBookHandler().createFromFile(tplFile);
						
					_this.getBookHandler().setName(name);
					_this.getBookHandler().setAuthor(author);
					_this.getBookHandler().setPress(press);
					_this.getBookHandler().setForward(forward);
					_this.getBookHandler().setDescript(description);
					_this.render();
					_this.save();
					// $EndDialog(_this.dlgBookManage);
					setTimeout(function(){$EndDialog(_this.dlgBookManage);}, 100);
					return true;
				},
			});   
		} else if(action == MANAGE_EDIT) {
			_this.getBookHandler().setName(name);
			_this.getBookHandler().setAuthor(author);
			_this.getBookHandler().setPress(press);
			_this.getBookHandler().setForward(forward);
			_this.getBookHandler().setDescript(description);
			_this.tree.setItemText(0, name);
			_this.save();
			$EndDialog(_this.dlgBookManage);
		}
	});
        
	_this.dlgBookManage.addBottomButton(' 取 消 ', 'syscancelbtn', function() {
		$EndDialog(_this.dlgBookManage);
	});  
}

// called on save
function MENU_Save(_this) {
    _this.pagesave();
    return false; //this disables default action (submitting the form)
}

function MENU_Edit(_this) {
    _this.pageedit(_this.tree.getItemData(_this.tree.selected));
}

function MENU_AddPage(_this) {
    MENU_PageManage(_this, MANAGE_CREATE);
}

function MENU_Delete(_this) {
    var Node = _this.tree.getItemNode(_this.tree.selected);
    $MessageBox('删除节点', '确定要删除节点['+Node.text+']', MSGBOX_YESNO, {
        onok:function() {
            var pageNode = _this.tree.getItemData(_this.tree.selected);
            if(!_this.tree.remove(_this.tree.selected)) {
                msgbox('删除失败！');
                return;
            }
            pageNode.parentNode.removeChild(pageNode);
            _this.save(true);
            msgbox('delete Node[' + Node.text + '] successfully!');
        }
    })
}

function MENU_Settings(_this, action) {
    if( $IsWindow($GetWindow(_this.dlgSettings)) ) {
        return;
    } else {
        _this.dlgSettings = new __DIALOG('Settings', null);
        var hwnd = $GetWindow(_this.dlgSettings);
        $SetTitleText(hwnd, 'Settings - XMLBook Editor Powered By ONLYAA.COM')
        //$GetClient(hwnd).innerHTML = _this.tmpInstance.load('Settings');
        _this.dlgSettings.doModal();
        $ResizeTo(hwnd, 500, 200);
        $CenterWindow(hwnd);
        
        var XQL = 'CONFIGURE/RESOLUTION[@id="default"]/SAVEPATH';
        var node = _this.configFileHandle.selectSingleNode(XQL);
        if(!node) {
            msgbox('该项不存在！');
            $EndDialog(_this.dlgSettings);
            return;
        }
        
        // do data exchange
        _this.dlgSettings.savepath = new __DDXITEM('SAVE_PATH', _this.dlgSettings.DataExchanger);
        _this.dlgSettings.savepath.set(node.text);
        _this.dlgSettings.UpdateData(false);
        
        _this.dlgSettings.addBottomButton(' 应 用 ', 'sysbtn', function() {
            _this.dlgSettings.UpdateData(true);
            var savepath = _this.dlgSettings.savepath.toString();
            if(savepath == '') {
                msgbox('保存路劲不能为空!');
                return; 
            }
            node.text = savepath;
            _this.configFileHandle.save(_this.configure);
            msgbox('成功修改配置!');
            $EndDialog(_this.dlgSettings);
        });
        
        _this.dlgSettings.addBottomButton(' 取 消 ', 'syscancelbtn', function() {
            $EndDialog(_this.dlgSettings);
        });
    }    
}   

function MENU_Help(_this) {

/*
	var d = new Q.Window({
		
	});

	d.setVisibility(true);
	d.center();
	return;
*/

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
            // alert(tree);
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
