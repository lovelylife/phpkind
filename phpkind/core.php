<?php
/*--------------------------------------------------------------------
 $ file: core.php
 $ date:   2009-4-5 18:24:26
 $ author: LovelyLife 
 $ bug fixed:
 
 [2011-07-24]:
 1. 解决json_decode无法处理单引号转义的json数据
----------------------------------------------------------------------*/

// 禁用数据库和文件中的引号转义 
@set_magic_quotes_runtime(0);

define('MAGIC_QUOTES_GPC', get_magic_quotes_gpc());

// 导入系统配置
include_once(_KROOT."/config.php");

// 导入系统常用函数库
include_once(_KROOT."/function.php");

// check session path
{
  $session_path = session_save_path();
  $use_own_path = false;
  if (is_dir($session_path)) {
    $use_own_path = !is_writable($session_path);
  } else {
    $use_own_path = true;
  }

  if($use_own_path) {
    //print_r(get_defined_vars());
    $session_path = _KROOT.'/session';
    createfolders($session_path);    
  }

  if(!is_writable($session_path)) {
    trigger_error("session path is not writable. $session_path", E_USER_ERROR);
  } else {
    session_save_path($session_path);
  }
}

//　session start
session_start();

// register_global setting
if(ini_get('register_globals')) {
  foreach($_SESSION as $key=>$value) {
    if(isset($GLOBALS[$key])) unset($GLOBALS[$key]);
  }
}

// 清除不需要的全局变量，保存系统使用的变量
$variables_whitelist = array (

    'GLOBALS',
    '_SERVER',
    '_GET',
    '_POST',
    '_REQUEST',
    '_FILES',
    '_ENV',
    '_COOKIE',
    '_SESSION',
    'error_handler',
    'variables_whitelist',
    'key',

/* PHPKIND reservered { */
  '__DEBUG__',
    '_PHPKIND_ENVS',
    '_start',

  '_APP',
  '_MODULE',
  '_ACTION',
/* } */
);

foreach (get_defined_vars() as $key => $value) {
    if (! in_array($key, $variables_whitelist)) {
        unset($$key);
    }
}

unset($key, $value, $variables_whitelist);

//$_GET['test'] = 'dddddddd\'';
// tainting detect

// 如果单引号转义没有开启，则自动加上'\'处理
if(!MAGIC_QUOTES_GPC) {
  foreach($_GET as $_key => $_value) {
    $_GET[$_key] = daddslashes($_value);
  }
  
  foreach($_POST as $_key => $_value) {
    $_POST[$_key] = daddslashes($_value);
  }
  
  foreach($_COOKIE as $_key => $_value) {
    $_COOKIE[$_key] = daddslashes($_value);
  }
}

// Ajax 模式
$S_AJAX_MODE = false;
if(isset($_GET['inajax'])) {
  $S_AJAX_MODE = (strtolower($_GET['inajax']) == "true");
}
 
// Ajax 处理
if($S_AJAX_MODE) {
  include_once(_KROOT.'/ajax.lib.class.php');
  $data = $_POST['postdata'];

  // 去掉单引号转义，否则json_decode无法工作
  if(MAGIC_QUOTES_GPC) {
    $data = stripcslashes($data);
  }
  
  $data = urldecode($data);
  if(empty($data)) {
    $data = '{"header":"","data":"","extra":""}';
  }
  $_POST = json_decode($data, true);

  if(empty($_POST)) {
    trigger_error('Invalid ajax package!\ndata:\n\n'.urldecode($_POST["postdata"]), E_USER_ERROR);
  }  
}

// algorys
include_once(_KROOT."/algory.class.php");
// dtl libaries
include_once(_KROOT.'/dtl.class.php');
// pager
include_once(_KROOT."/page.class.php");
include_once(_KROOT.'/configfile.class.php');
// for templates
include_once(_KROOT.'/templates.class.php');

// application frame work
include_once(_KROOT.'/module.class.php');
include_once(_KROOT.'/application.class.php');     
include_once(_KROOT.'/command.class.php');

//!初始化应用程序
//!application frame work
require(_KROOT.'/apploader.class.php');
new CLASS_APPLOADER($_GET['app']);

?>
