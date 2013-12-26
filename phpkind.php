<?php
/*--------------------------------------------------------------------
 $ module: phpkind.php
 $ date:   2010-4-6 18:24:26
 $ author: LovelyLife 
 $ last modified: 2012-07-21 12:36:22
 $ 以ROOT结尾的为带盘符的绝对路径, 以PATH结尾的为相对路径
 $ 
 全局宏：
 _BIND_ROOT			- 域名绑定的目录
 _IROOT             - 虚拟主机的物理目录
 _IPATH             - 虚拟主机的相对域名绑定(_BIND_ROOT)的路径
 _KROOT				- phpkind框架的物理目录
 _KPATH				- phpkind框架的相对域名绑定(_BIND_ROOT)路径

----------------------------------------------------------------------*/

// 获得脚本执行时间
$_start = microtime(true);

$__DEBUG__ = true;	// 开发环境， debug开启，将错误抛出

if($__DEBUG__) {
	error_reporting(E_ALL || ~E_NOTICE || ~E_DEPRECATED);
}

// bind error handler
set_error_handler(err_handler, E_ALL);

// 虚拟主机的路径 __file__
if(!defined('_IROOT')) {
  define('_IROOT', str_replace('\\', '/', dirname(__FILE__)));
}

// 处理某些的虚拟主机script_filename 和 __FILE__所在根目录不是同一个目录
if(!defined('_IPATH') || !defined('_BIND_ROOT')) {

	$bind_root = str_replace('\\', '/', 
		substr($_SERVER['SCRIPT_FILENAME'], 0, 0-strlen($_SERVER['PHP_SELF'])));

	$pos = strpos(_IROOT, $bind_root);
	if(!$pos && is_bool($pos)) {
		// 绝对路径冲突
		define('_BIND_ROOT', common_substr(_IROOT, $bind_root));

	} else {
		define('_BIND_ROOT', $bind_root);
	}

	$len = strlen(_BIND_ROOT);
	define('_IPATH', substr(_IROOT, $len, strlen(_IROOT)-$len));
}

// 框架相的路径
(!defined('_KROOT')) && define('_KROOT', _IROOT.'/phpkind');
(!defined('_KPATH')) && define('_KPATH', _IPATH.'/phpkind');

function err_handler( $errno , $errstr , $errfile , $errline) {
    if($errno != E_NOTICE && $errno != E_DEPRECATED && $errno != E_WARNING) {
        echo "<pre><h1>PHPKind Exception:<h1>";
        echo "<h3>Application: </h3>".$_GET['app']."\n";
        echo "<h3>Message: </h3>".$errstr."\n";
        // echo "<h3>File: </h3>".$errfile." : ". $errline."\r\n";
	echo print_stack_trace();
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
      $html .=str_ireplace(_IROOT, '', str_replace('\\', '/', $row['file'])) .":".$row['line'].", ".$row['function']."\n";
    }
    $count++;
  }
  
  return $html;
}

function common_substr($str1, $str2) {
	$string_parent   = ""; //父串
	$string_sub      = ""; //字串
	$string_current  = ""; //当前的字串
	$string_left     = ""; //剩余的字串
	$length_left     = 0;  //剩余的字符串长度
	$string_result   = ""; //最终返回的字符串
   
	 //以长串为父串,短串为子串
	if (strlen($str1) >= strlen($str2)) {
		$string_parent = $str1;    
		$string_sub = $str2;
	} else {
		$string_parent = $str2;    
		$string_sub = $str1;
	}

	//遍历短串    
	for ($i = 0; $i < strlen($string_sub); $i++) {
		$string_current = ""; //重置当前的字串
		$string_left = substr($string_sub, $i); //剩余的字符串
		$length_left = strlen($string_left);    //剩余字串的长度
		for ($j = 0; $j < $length_left; $j++) {
			$string_current .= $string_left{$j};				
			//在父串中查找字串,如果长度比保存的值长就更新
			if (strpos($string_parent, $string_current) 
				&& strlen($string_current) > strlen($string_result))
			{
				$string_result = $string_current;
			}        
		}
	}

	return $string_result;
}

?>
