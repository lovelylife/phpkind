<?php
/*

COMMAND应用程序默认处理模块
date: 2012-07-25 10:22:55
author: Q

*/

class CLASS_MODULE_DEFAULT extends CLASS_MODULE {
    // 应用程序目录
    private $app_root;

    function __construct() {
	  parent::__construct();
    }

    function CLASS_MODULE_DEFAULT() { $this->__construct(); }

    function doMain($action) {
	  $this->app_root = $this->App()->getAppRoot();
	  $this->index();
    }
    
    function doAjax($action) {
		$this->app_root = $this->App()->getAppRoot();
	    $data = &$_POST['data'];
	    $command = $data['cmd'];
	    switch($action) {
	    case "execute":
		    $this->Execute($command);
    	    break;
    	case "check-online":
			if(isset($_SESSION['username']) && empty($_SESSION['username'])) {
				$this->AjaxData(1);
			} else {
				$this->AjaxData(0);
			}
    	    break;
        }
    }

    function index() {
		//! 启动默认首页
        $t = new CLASS_TEMPLATES($this->App()); 
        $t->push('title', "PHPKind command tools Powered By PHPKind");
        $t->render('index');
    }

    function Execute($command) {
	// 解析命令行,类shell命令行，第一个参数是操作的命令名称
	$command .= " ";
	preg_match_all("/(([^\s\"]*\"[^\"]*\"?)|([^\s]+))\s+/i", $command, $matches);
	// print_r($matches);
	if(!empty($matches) && !empty($matches[0])) {
	    $cmd = trim($matches[0][0]);
	    switch($cmd) {
	    case "cd":
		  $this->command_cd(count($matches[0]), $matches[0]);
		  break;
        case "apps":
          //$this->AjaxData('apps command is under construct.');
          $this->command_apps(count($matches[0]), $matches[0]);
          break;
	    case "info": {
		    ob_start();
		    phpkind_info();
		    $info = ob_get_clean();
		    $this->AjaxData($info);
		    break;
		  }
	    case "test":
		  $this->AjaxData("only a test command.");
		  break;
	    default:
		  $this->AjaxData("command '".$cmd."' is not found");
	    }
	} else {
	    $this->AjaxData("Invalid command line.");
	}
  }

  function command_cd($argc, &$argv) {
	if($argc <2) {
	    $this->AjaxData("paramter not enough.");
	} else {
	    $appname = $argv[1];
	    // 如果应用程序不存在，则返回失败
	    // 保存当前应用程序到SESSION里面，便于应用程序操作
	    $this->AjaxData("change to app '".$appname."'.");
	}
    }

    function command_apps($argc, $argv) {
	require_once($this->App()->getAppRoot().'/apptool.command.php');
	if(!class_exists('AppTool_Command')) {
             $this->AjaxData('class not founded, AppTool_Command!');
             return false;
        }
        $the_command = new AppTool_Command($this->App(), $argc, $argv);
        $this->AjaxData($the_command->stdout());
	/*
        for($i=1; $i<$argc; $i++) {
            $param = trim($argv[$i]);
            switch($param) {
	    case "list":
                $this->AjaxData("appliactions list: aaa\nbbb\n");
		break;
            case "create":
                
            default:
	        $this->AjaxData("invalid paramter \"".$param."\"!");	
	    }
        }
	*/
    }
}



?>
