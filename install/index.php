<?php
header("Content-type: text/html;charset=utf-8");
//error_reporting(E_ERROR | E_PARSE);
error_reporting(E_ALL || ~E_NOTICE);
set_time_limit(0);
set_magic_quotes_runtime(0);
define('VERSION','4.1.0');

if(PHP_VERSION < '4.1.0') {
	$_GET         = &$HTTP_GET_VARS;
	$_POST        = &$HTTP_POST_VARS;
	$_COOKIE      = &$HTTP_COOKIE_VARS;
	$_SERVER      = &$HTTP_SERVER_VARS;
	$_ENV         = &$HTTP_ENV_VARS;
	$_FILES       = &$HTTP_POST_FILES;
}

define('MAGIC_QUOTES_GPC', get_magic_quotes_gpc());
isset($_REQUEST['GLOBALS']) && exit('Access Error');
foreach(array('_COOKIE', '_POST', '_GET') as $_request) {
	foreach($$_request as $_key => $_value) {
		$_key{0} != '_' && $$_key = daddslashes($_value);
	}
}

$m_now_time     = time();
$m_now_date     = date('Y-m-d H:i:s',$m_now_time);

$localurl="http://";
$localurl.=$_SERVER['HTTP_HOST'].$_SERVER["PHP_SELF"];
$install_url=$localurl;

// set error handler
function err_handler( $errno , $errstr , $errfile , $errline) {
    if($errno != E_NOTICE && $errno != E_DEPRECATED) {
        echo "<pre><h1>PHPKind Exception:<h1>";
        echo "<h3>Message: </h3>".$errstr."\n";
        echo "<h3>File: </h3>".$errfile." : ". $errline."\r\n";
	    echo "</pre>\r\n";
        exit(1);
    }    
}

// bind error handler
set_error_handler(err_handler, E_ALL);

include('./configfile.class.php');

$appName = $_GET['app'];
if(empty($appName)) {
	trigger_error(''.$config_file.'不存在!', E_USER_ERROR);
}

$install_sql = '../applications/'.$appName.'/install.sql.php';
$lock_file = '../applications/'.$appName.'/install.lock';
$config_file = '../applications/'.$appName.'/config.php';

if(file_exists($lock_file)){
	exit('对不起，该程序已经安装过了。<br/>
	      如您要重新安装，请手动删除'.str_ireplace('../applications/', '', $lock_file).'文件。');
}

if(!file_exists($config_file)) {
	trigger_error('配置文件'.$config_file.'不存在!', E_USER_ERROR);
}

// 加载配置文件
$_app_cfgs = new CLASS_CONFIG_FILE($config_file);

switch ($action) {
case 'inspect': {
  $env_check = true;
  $mysql_support = (function_exists( 'mysql_connect')) ? 'on' : 'off';
  if(function_exists( 'mysql_connect')){
    $mysql_support  = 'on';
    $mysql_ver_class ='ok';
  } else {
    $mysql_support  = 'off';
    $mysql_ver_class ='warn';
    $env_check = false;
  }
  
  $gd_support = "";
  if ($gdv = gdVersion()) {
    if ($gdv >=2) {
      $gd_support= "on"; // 'TrueColor functions may be used.';
    } else { 
      $gd_support = "off"; //  'GD version is 1.  Avoid the TrueColor functions.';
      $env_check = false;
    }
  } else {
    $gd_support = "off"; // "The GD extension isn't loaded.";
    $env_check = false;
  }

  if(PHP_VERSION<'4.1.0'){
	$ver_class = 'WARN';
    $env_check = false;
	$errormsg['version']='php 版本过低';
  } else {
	$ver_class = 'ok';
	$check=1;
  }

  $w_check=array(
	'../applications/',
	'../applications/'.$_GET['app'],
	'../applications/'.$_GET['app'].'/config.php',
  );
  $class_check=array();
  $check_msg = array();
  $count=count($w_check);
  for($i=0; $i<$count; $i++) {
	if(!file_exists($w_check[$i])){
	  $check_msg[$i].= '文件或文件夹不存在请上传';$check=0;
	  $class_check[$i] = 'err';
	} elseif(is_writable($w_check[$i])){
	  $check_msg[$i].= '通 过';
	  $class_check[$i] = 'ok';
	  $check=1;
	} else{
	  $check_msg[$i].='777属性检测不通过'; $check=0;
	  $class_check[$i] = 'WARN';
	}
  }

  if($check!=1||!$env_check){
	$disabled = 'disabled';
  }
  require('templates/inspect.htm');
  break;
}
	
case 'db_setup': {
  global $_app_cfgs;
  $cfg = &$_app_cfgs->config();
  $cfg = &$cfg['dbs']['default'];
  if($setup==1){			
	/*
	'type' => 'mysql',
	'host' => 'host',
	'user' => 'root',
	'pwd'  => '',
	'dbname' => 'cdmusic',
	'lang' => '',
	'prefix'=> 'cdb_'
	*/
	$cfg['prefix'] = $db_prefix	  = trim(strip_tags($db_prefix));
	$cfg['host']   = $db_host     = trim(strip_tags($db_host));
	$cfg['user']   = $db_username = trim(strip_tags($db_username));
	$cfg['pwd']    = $db_pass     = trim(strip_tags($db_pass));
	$cfg['dbname'] = $db_name     = trim(strip_tags($db_name));
			
	// 写入配置文件
	$_app_cfgs->save();

	$db = mysql_connect($db_host,$db_username,$db_pass) 
		  or die('连接数据库失败: ' . mysql_error());
	if(!@mysql_select_db($db_name))
	{
	  mysql_query("CREATE DATABASE $db_name DEFAULT CHARACTER SET utf8") 
	  or die('创建数据库失败'.mysql_error());
	}
	
    mysql_select_db($db_name);
	if(mysql_get_server_info()>='4.1'){
	  mysql_query("set names utf8"); 
	  $content=readover($install_sql);
	} else {
	  trigger_error('您的mysql版本过低, 需要升级至 4.1或者更高版本.', E_USER_ERROR);
	}
	// 删除第一行和最后一行
	$content=preg_replace("/^<\?php.*?\/\*/eis", '', $content);
	$content=preg_replace("/#\*\/\s*\?>$/eis",  '', $content);
	$content=preg_replace("/{#(.+?)}/eis", '$lang[\\1]', $content);
	require('templates/db_setup.htm');
	exit();
  } else {
	require('templates/databasesetup.htm');
  }
  break;
}

case 'adminsetup': {
  global $_app_cfgs;
  $cfg = &$_app_cfgs->config();
  $cfg = &$cfg['dbs']['default'];
  if( $setup == 1 ){
	$regname  = trim(strip_tags($regname));
	$regpwd   = md5(trim(strip_tags($regpwd)));
	$email    = trim(strip_tags($email));
	$m_now_time = time();	
    $link = mysql_connect($cfg['host'], $cfg['user'], $cfg['pwd']) 
		or die('连接数据库失败: ' . mysql_error());
	mysql_select_db($cfg['dbname']);
	if(mysql_get_server_info()>4.1){
	  mysql_query("set names utf8"); 
	}

	if(mysql_get_server_info()>'5.0.1'){
	  mysql_query("SET sql_mode=''",$link);
	}
		
	$fields = array();
	$fields['uname'] = $regname;
	$fields['pwd'] = $regpwd;
	$fields['email'] = $email;
	$fields['createtime'] = $m_now_date;
	$fields['group_id'] = 1;
	$sql = insertSQL($cfg['prefix'].'admin', $fields);
	mysql_query($sql) or die('写入数据库失败: ' . mysql_error());

	// 创建lock文件
	$fp  = fopen($lock_file, 'w');
	fclose($fp);
	@chmod($lock_file,0554);
	require('templates/finished.htm');
  }else {
	require('templates/adminsetup.htm');
  }
  break;
}
default:
{
  require('templates/index.htm');
}

}

function create_table($content) {
  global $installinfo,$db_prefix,$db_setup;
  global $_app_cfgs;
  $cfg = $_app_cfgs->config();;
  $db_prefix = $cfg['dbs']['default']['prefix'];
  // print_r($cfg);
  if(empty($db_prefix)) {
	echo '表前缀不能为空';
	return;
  }

  $content = str_replace('{$prefix}', $db_prefix, $content);
  $sql=explode("\n",$content);

  $query='';
  $j=0;
  foreach($sql as $key => $value){
	$value=trim($value);
	if(!$value || $value[0]=='#') continue;
	if(eregi("\;$",$value)){
		$query.=$value;
		if(eregi("^CREATE",$query)){
			$name=substr($query,13,strpos($query,'(')-13);
			$c_name=$name; // str_replace('ch_',$db_prefix,$name);
			$i++;
		}
		//echo $query;
		// $query = str_replace('ch_',$db_prefix,$query);
		if(!mysql_query($query)){
			$db_setup=0;
			if($j!='0'){
			echo '<li class="WARN">出错：'.mysql_error().'<br/>sql:'.$query.'</li>';
			}
		}else {
		     
			if(eregi("^CREATE",$query)){
				$installinfo='<li class="OK"><font color="#0000EE">建立数据表</font>'.$c_name.' ... <font color="#0000EE">完成</font></li>';
				echo $installinfo;
			}
			$db_setup=1;
		}
		$query='';
	} else{
		$query.=$value;
	}
	$j++;
  }
}
function readover($filename,$method="rb"){
if($handle=@fopen($filename,$method)){
	flock($handle,LOCK_SH);
	$filedata=@fread($handle,filesize($filename));
	fclose($handle);
}
return $filedata;
}
function daddslashes($string, $force = 0) {
!defined('MAGIC_QUOTES_GPC') && define('MAGIC_QUOTES_GPC', get_magic_quotes_gpc());
if(!MAGIC_QUOTES_GPC || $force) {
	if(is_array($string)) {
		foreach($string as $key => $val) {
			$string[$key] = daddslashes($val, $force);
		}
	} else {
		$string = addslashes($string);
	}
}
return $string;
}

// 组合insert语句(insert into ##__$table(...) values(...);
function insertSQL($table, $fields) {
if(!is_array($fields)) { return -1;	}
$setFields = array();
$setValues = array();
foreach($fields as $name => $value) {
	array_push($setFields, $name);
	array_push($setValues, addslashes($value));
}
$setFields = "`".implode("`,`", $setFields)."`";
$setValues = "'".implode("','", $setValues)."'";

$sql = "INSERT INTO `".$table."` (".$setFields.") VALUES(".$setValues.");";
return $sql;	
}

/* ch version of GD is installed, if any.
*
* Returns the version (1 or 2) of the GD extension.
*/
function gdVersion($user_ver = 0)
{
    if (! extension_loaded('gd')) { return; }
    static $gd_ver = 0;
    // Just accept the specified setting if it's 1.
    if ($user_ver == 1) { $gd_ver = 1; return 1; }
    // Use the static variable if function was called previously.
    if ($user_ver !=2 && $gd_ver > 0 ) { return $gd_ver; }
    // Use the gd_info() function if possible.
    if (function_exists('gd_info')) {
        $ver_info = gd_info();
        preg_match('/\d/', $ver_info['GD Version'], $match);
        $gd_ver = $match[0];
        return $match[0];
    }
    // If phpinfo() is disabled use a specified / fail-safe choice...
    if (preg_match('/phpinfo/', ini_get('disable_functions'))) {
        if ($user_ver == 2) {
            $gd_ver = 2;
            return 2;
        } else {
            $gd_ver = 1;
            return 1;
        }
    }
    // ...otherwise use phpinfo().
    ob_start();
    phpinfo(8);
    $info = ob_get_contents();
    ob_end_clean();
    $info = stristr($info, 'gd version');
    preg_match('/\d/', $info, $match);
    $gd_ver = $match[0];
    return $match[0];
} // End gdVersion()

?>
