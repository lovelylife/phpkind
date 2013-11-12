<?php

/*----------------------------------------------------
 $ 名称: apploader.class.php
 $ 功能: 加载应用程序类
 $ 参数:
 		$str  		预处理的字符串
 		$force		强制转换
 $ 返回值: 处理结果
------------------------------------------------------*/


class CLASS_APPLOADER {
    
	function __construct($appName) {
		global $_PHPKIND_ENVS, $S_AJAX_MODE;

		//! 调用接口参数
		$args = array();

		//! 应用程序名称检测，如果不存在则加载默认应用程序
		if(empty($appName)) {
		  $appName = $_PHPKIND_ENVS['_defaultApp'];
		} else if(!in_array($appName, $_PHPKIND_ENVS['_allowedApps']))  {
		  trigger_error('application not found or authorized ', E_USER_ERROR);
		}

		// 构造入口参数
		$app_dir = $_PHPKIND_ENVS['_appsDir'];
		
		if(!empty($app_dir)) {
			$app_dir .= '/';
		}

		$app_root = $app_dir.$appName;

		/**/
		if(!file_exists($app_root.'/install.lock')){
			die("<html><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"/> 
<meta http-equiv=\"Content-Language\" content=\"utf-8\"/> <body>对不起，第一次使用该程序需要安装，请点击<a href=\"install/?app={$appName}\">安装</a></body></html>");
		}

		$args['appName'] = $appName;
		$args['appPath'] = get_path($app_dir.$appName);
		$args['appRoot'] = $app_root;
		$args['appHost'] = $_SERVER["HTTP_HOST"];
		$args['module']  = $_GET['mod'];
		$args['action']	 = $_GET['action'];	
		$args['appCfgFile'] = $app_root.'/config.php';
		$args['ajaxmode'] = $S_AJAX_MODE;

		//! 初始化应用程序实例
		$app_file = $app_root.'/app.class.php';
		if(!file_exists($app_file))  {
			trigger_error('application['.$appName.'] class not found.', E_USER_ERROR);
		}
        
		//!应用程序文件
		require($app_file);
	
		// 检测有效模块，如果不存在使用默认模块处理
		$valid_module = $args['module'];
		if(empty($valid_module)) {
			$valid_module = 'default';
      $args['module'] = $valid_module;
		}

	  // 创建应用程序实例
    $appClass = 'CLASS_'.strtoupper($args['appName']).'_APPLICATION';
        
	    if(!class_exists($appClass)) {
            trigger_error("class $appClass is not found.", E_USER_ERROR);
        }
        
        //! 创建应用程序目录结构
        $paths = $this->checkAppRequired($args['appRoot'], $args);
        //$args = array_merge($args, $paths);
        $args['settings'] = &$paths;
	
        // echo 'before initialized the application';
        new $appClass($args);
    }
    
    function CLASS_APPLOADER ($appName){
        $this->__construct($appName);
    }
    
    function checkAppRequired($appRoot, &$args) {
        $appRequiredFile = $appRoot.'/app.required.php';
        if(!file_exists($appRequiredFile)) {
            // 已经不再支持应用程序文件修复，可以使用command工具修复
            //if(!copy(_KROOT.'/app_templates/app.required.php', $appRequiredFile)) {
            //    //writelog("restore file error.");
            //    trigger_error('restore file error.', E_USER_ERROR);
            //}
            trigger_error("fatal error, file \"app.required.php\" is not found.", E_USER_ERROR);
        }
        
        $paths = require($appRequiredFile);
        
        foreach($paths as $key => $value) {
            if(!key_exists($key, $args) && preg_match('/_dir$/i', $key)) {
                $dirName = $appRoot.$value;
                if(!is_dir($dirName)) {
                    createfolders($dirName, true);
                }
            }
        }

        return $paths;
    }
}

?>
