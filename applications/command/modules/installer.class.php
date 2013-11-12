<?php
/*

安装应用程序模块
date: 2012-09-08 14:09:55
author: Q

*/

class CLASS_MODULE_INSTALLER extends CLASS_MODULE {
    // 安装的应用程序
    private $install_app;

    public function __construct($theApp) {
	    parent::__construct($theApp);
    }

    public function CLASS_MODULE_INSTALLER($theApp) { $this->__construct($theApp); }

    function doMain($action) {
	    $this->index();
    }
    
    function doAjax($action) {
	    $data = &$this->request['data'];
	    $command = $data['cmd'];
	    switch($action) {
	    case "execute":
		    $this->Execute($command);
    	    break;
    	case "check-online":
			if(isset($_SESSION['username']) && empty($_SESSION['username'])) {
				//$this->AjaxData(1);
			} else {
				//$this->AjaxData(0);
			}
    	    break;
        }
    }

    function index() {
		//! 启动默认首页
        $t = new CLASS_TEMPLATES;
        $t->push('title', "PHPKind command tools Powered By PHPKind");
        $t->render('installer.1');
    }
}



?>
