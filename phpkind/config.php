<?php
/*--------------------------------------------------------------------
 $ module: config.php
 $ date:   2009-4-5 18:24:26
 $ last modified: 2012-07-19
 $ author: LovelyLife 

 $logs:
	1.add log path by LovelyLife
----------------------------------------------------------------------*/

global $_PHPKIND_ENVS;

!defined('SESSION_TAG') && define('SESSION_TAG', 'phpkind.session');

$_PHPKIND_ENVS = array();

//! 应用程序集目录, 绝对地址, 可以使用工具重新设置
$_PHPKIND_ENVS['_appsDir'] = _IROOT.'/applications';

// 模块目录,相对于应用程序目录，相对地址
$_PHPKIND_ENVS['_modulesDir'] = '/modules';

//! 允许访问的应用程序列表
$_PHPKIND_ENVS['_allowedApps'] = array(
  'wayixia',
  'cms',
  'cdmusic',
  'command',
  'samples',
  'collector',
);

//! 默认应用程序
$_PHPKIND_ENVS['_defaultApp'] = 'wayixia';

//! 已经启动的Application
$_PHPKIND_ENVS['_theApp'] = null; 

//! 非应用程序模块
$_PHPKIND_ENVS['_shareModules'] = array(
    's.php', 
    'test.php',
    'cms/fckeditor/editor/filemanager/connectors/php/connector.php'
);

$_PHPKIND_ENVS['log'] = '/log';

?>
