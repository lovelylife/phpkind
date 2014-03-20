<?php
/*--------------------------------------------------------------------
 $ module: phpkind.php
 $ date:   2010-4-6 18:24:26
 $ author: LovelyLife 
 $ last modified: 2012-07-21 12:36:22
 $ 以ROOT结尾的为带盘符的绝对路径, 以PATH结尾的为相对路径
 $ 
 全局宏：
 _VROOT        - 虚拟主机根目录
 _KROOT        - phpkind框架的物理目录
----------------------------------------------------------------------*/

// phpkind 用到的宏
define('_PHPKIND'   , 1);
define('SESSION_TAG', 'phpkind.session');

// 获得脚本执行时间
$_start = microtime(true);

$__DEBUG__ = true;  // 开发环境， debug开启，将错误抛出

if($__DEBUG__) {
  error_reporting(E_ALL || ~E_NOTICE || ~E_DEPRECATED);
}

// bind error handler
set_error_handler(err_handler, E_ALL);

// 处理某些的虚拟主机script_filename 和 __FILE__所在根目录不是同一个目录
if(!defined('_BIND_ROOT')) {

  $bind_root = str_replace('\\', '/', 
    substr($_SERVER['SCRIPT_FILENAME'], 0, 0-strlen($_SERVER['PHP_SELF'])));
  define('_BIND_ROOT', $bind_root);
}

// 框架的根目录
define('_KROOT', str_replace('\\', '/', dirname(__file__)));


function err_handler( $errno , $errstr , $errfile , $errline) {
  if($errno != E_NOTICE && $errno != E_DEPRECATED && $errno != E_WARNING) {
    echo "<pre><h1>PHPKind Exception:<h1>";
    echo "<h3>Message: </h3>".$errstr."\n";
    // echo "<h3>File: </h3>".$errfile." : ". $errline."\r\n";
    if($GLOBALS['__DEBUG__']) {
      echo print_stack_trace();
    }
    echo "</pre>\r\n";
    exit(1);
  }    
}

function print_stack_trace() {
  $array =debug_backtrace();
  unset($array[0]);
  $html = "<h3>File: </h3>";
  $count = 0;
  foreach($array as $row) {
    if($count > 0) {
      $html .=str_ireplace(_KROOT, '', str_replace('\\', '/', $row['file'])) .":".$row['line'].", ".$row['function']."\n";
    }
    $count++;
  }
  
  return $html;
}

// 加载phpkind内核
include(_KROOT.'/core.php');

?>
