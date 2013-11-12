<?php
/*--------------------------------------------------------------------
 $ apptool.command.php
 $ app tool for sdk
 $ author Q
 $ date: 2012-07-25 23:30:04
----------------------------------------------------------------------*/

class AppTool_Command extends COMMAND {

    private $_theApp;
    private $_apps_root_dir;
    function __construct($app, $argc, $argv) {
        global $_PHPKIND_ENVS;
        $this->_theApp = $app;
        parent::__construct($app, $argc, $argv);
        $this->_apps_root_dir = $_PHPKIND_ENVS['_appsDir'];
        $param = trim($argv[1]);
	    // $this->out($param);
        switch($param) {
        case "list":
            $this->out("appliactions:\n".$this->listapps());
            break;
        case "create": {
                if($argc < 3) {
                    $this->out("paramter is not enough");
                } else {
                    $this->create(trim($argv[2]));
                }
            }  
            break;
		case "repair": {
                if($argc < 3) {
                    $this->out("paramter is not enough");
                } else {
                    $this->repair(trim($argv[2]));
                }
            }  
			break;
        default:
            $this->out("invalid paramter \"".$param."\"!");
        }
    }
	
    function AppTool_Command($argc, $argv) {
        $this->__construct($argc, $argv);
    }
	
    // 创建应用程序
    function create($app_name) {
        $app_dir = $this->_apps_root_dir.'/'.$app_name;
        //$module_dir = $app_dir.$_PHPKIND_ENVS['_modulesDir'];
        if(is_dir($app_dir)) {
            // 应用程序已经存在
            $this->out("the application \"{$app_name}\" has exists");
            return false;
        } else {
            // 创建应用程序目录
            createfolders($app_dir);
            $constructor_template = $this->_theApp->getAppRoot().'/constrcutor.config.php';
            if(!file_exists($constructor_template)) {
                $this->out("fatal error, file {$constructor_template}  not found, please check it.");
                return false;
            } else {
                $this->out("creating new application \"{$app_name}\"...");
                $items = require($constructor_template);
                $len = count($items);
                for($i=0; $i<$len; $i++) {
                    $this->construct_app_($app_name, $items[$i]);
                }
            }
        }
    }

	function repair($app_name) {
	$app_dir = $this->_apps_root_dir.'/'.$app_name;
        //$module_dir = $app_dir.$_PHPKIND_ENVS['_modulesDir'];
        if(!is_dir($app_dir)) {
            // 应用程序已经存在
            $this->out("the application \"{$app_name}\" is not exists");
            return false;
        } else {
            // 创建应用程序目录
            // createfolders($app_dir);
            $constructor_template = $this->_theApp->getAppRoot().'/constrcutor.config.php';
            if(!file_exists($constructor_template)) {
                $this->out("fatal error, file {$constructor_template}  not found, please check it.");
                return false;
            } else {
                $this->out("repair the application \"{$app_name}\"...");
                $items = require($constructor_template);
                $len = count($items);
                for($i=0; $i<$len; $i++) {
                    if(!$this->construct_app_($app_name, $items[$i])) {
			
			break;
		    }
                }
            }
        }
	
	}

    // 根据传入的$item, 构造一个app需要的文件或者文件夹
    // { 't'=>bool,
    //   'tpl'=>'{dir|file from {KROOT}/app_templates}'
    //   'des'=>'{dir|file in current application root}'
    // }
    function construct_app_($app_name, $item) {
        $app_root = $this->_apps_root_dir.'/'.$app_name;

        $is_file = $item['t'];
        if($is_file) {
            // 构造文件
            $tplname = $item['name'];
            $desname = $app_root.$item['dir'].'/'.$item['name'];

            if(file_exists($desname)) {
                // 如果文件存在，则不覆盖
                return true;
            }
            $t = new CLASS_TEMPLATES($this->_theApp);
            $t->push('appname', $app_name);
            
            $buffer = $t->parse($tplname);           

            // 写入模板文件
            $f = fopen($desname,"w+");
            if($f) {
                fwrite($f, $buffer, strlen($buffer));
            } else {
                trigger_error("文件[{$desname}]打开失败", E_USER_ERROR);
            }
        } else {
            // 创建文件夹
            $name = $item['name'];
            $is_create_index = $item['createindex'];
            if(!empty($name)) {
                $new_dir = $app_root.$item['dir'].'/'.$name;
            } else {
                $this->out('construct dir name is empty.');
		return false;
            }
            createfolders($new_dir, $is_create_index);
	    $this->out($new_dir);
        }

	return true;
    }

    function listapps() {
        // 遍历app目录
        include_once(_KROOT.'/file.lib.class.php');
        // 应用程序集目录
        global $_PHPKIND_ENVS;
        $apps_dir = $_PHPKIND_ENVS['_appsDir'].'/';

	$result = CLASS_FILE::ls($apps_dir, FILE_FILTER_DIR);
        $size = count($result);

        if($size) {
            $str = "";
            for($i=0; $i < $size; $i++) {
                // 验证目录是否为phpkind应用程序
		$check_app_file = $result[$i]['path'].'/app.class.php';
                
                if(file_exists($check_app_file)) {
		    $str .= '# '.$result[$i]['name']."\n";
                }
            }
            return $str;
        } else {
           return "none.\n";
        }
    }
}

?>
