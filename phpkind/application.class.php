<?php
/*--------------------------------------------------------------------
 $ file: application.php
 $ date: 2010-8-22 00:24:26
 $ last modify: 2012-07-23 12:59:40
 $ author: LovelyLife 
 $ 应用程序框架
 ----------------------------------------------------------------------*/

//! 应用程序基类
class CLASS_APPLICATION {
  // ! application 环境
  private $_sName;    
  private $_sRoot;
  private $_sPath;
  private $_sHost;

  // 数据库集合
  private $_oDatabases;
    
  // 模块操作
  public  $_module;
  private $_action;
  private $_ajaxmode;

  // 日志路径
  private $_sLogPath;
  private $_sTemplatesPath;
  private $_sCachePath;
  private $_sDataPath;
  private $_sThemesPath;
  private $_sTheme;
  private $_sDefaultTheme;
        
  // 模板里的变量名称映射
  private $_refCONFIG;
  private $_refAPPS;
  private $_refTHEMES;    
  private $_refDICT;

  function __construct($args=array()) {
    //! 初始化应用程序环境
    $this->_refTHEMES  = array();
    $this->_refAPPS = array();
    $this->_refDICT = array();
    $this->_oDatabases = array();
      
    $this->_sName = $args['appName'];
    $this->_sRoot = $args['appRoot'];
    $this->_sPath = $args['appPath'];
    $this->_sHost = $args['appHost'];

    $this->_module = $args['module'];  
    $this->_ajaxmode = $args['ajaxmode'];
    $this->_action   = $args['action'];

    // 应用程序名称
    $this->_refAPPS['name'] = &$this->_sName;

    // 添加对QLib库的支持
    $this->_refAPPS['qlib'] = _IPATH.'/qlib';

    // 应用程序URL
    $this->_refAPPS['app'] = _IPATH.'/index.php?app='.$this->_sName;

    //! 模块URL
    $this->_refAPPS['module'] = $this->_refAPPS['app'] . '&mod='. $this->_module;

    // 应用程序相对路径
    $this->_refAPPS['path']  = _IPATH;

    // 主机域名
    $this->_refAPPS['host']  = &$this->_sHost;

    // 导入配置数据
    $this->_refCONFIG    = require($args['appCfgFile']);

    // 初始化资源和主题路径
    // 导入设置
    $paths = &$args['settings'];
    if(is_array($paths)) {
      $this->_sTemplatesPath = 
        empty($paths['templates']) ? '/templates' : $paths['templates'];
      $this->_sCachePath = 
        empty($paths['cache_dir']) ? '/cache' : $paths['cache_dir'];
      $this->_sDataPath = 
        empty($paths['data_dir']) ? '/data' : $paths['data_dir'];
      $this->_sThemesPath = 
        empty($paths['theme_dir']) ? '/themes' : $paths['theme_dir'];
      $this->_sSkin = 
        empty($paths['theme_current']) ? '/default' : $paths['theme_current'];
    }

    //! 初始化当前使用皮肤
    if(!empty($_COOKIE['skin'])) {
      $this->_sSkin = $_COOKIE['skin'];
    } else {
      $_COOKIE['skin'] = $this->_sSkin;
    }

    // 取消了js,images,css这些目录，直接使用theme目录
    $this->_refTHEMES['path'] =
    $this->_sPath.$this->_sThemesPath.$this->_sSkin; 
  
    // 导入包含文件
    $this->requireFiles($this->_sRoot.'/includes.required.php');
    // 启动程序
    $this->appMain($args);
  }

  function CLASS_APPLICATION($args = array()) 
  { 
    $this->__construct($args); 
  }
       
//! operations
    function getAppName() { return $this->_sName; }
    function getAppRoot() { return $this->_sRoot; }
    function getAppPath() { return $this->_sPath; }
    function getUrlApp()  { return $this->_refAPPS['app'];}
    function getUrlModule() { return $this->_refAPPS['module'];}
 
    function getAppLogPath() { return $this->_sLogPath; }
    function getTemplatesPath() {return $this->_sTemplatesPath; }
    function getDataPath()   { return $this->_sDataPath; }
    function getCachePath()  { return $this->_sCachePath; }
    function getTheme()       { return $this->_sSkin; }
    function getDefaultTheme(){ return '/default'; }
    function getAction()    { return $this->_action;   }
    function getModule()    { return $this->_module;   }
    function inAjax()      { return $this->_ajaxmode; }

    function& getCONFIG($segName=null) {
        if(empty($segName)) {
            return $this->_refCONFIG;
        } else {
            return $this->_refCONFIG[$segName];
        }
    }
    // deliver char is '.', for example: dbs.default.host
  function Config($cfg_name) {
    $subvars = split('\.', $cfg_name);
      $len = count($subvars);
    $value = $this->_refCONFIG[$subvars[0]];
      //print_r($subvars);
      for($i=1; $i<$len; $i++) {
        $key = $subvars[$i];
        if(is_array($value) && array_key_exists($key, $value)) {
          $value = $value[$key];
        } else {
          break;
        }
      }
    return $value;
  }
    
    function getAPPS($name) { return $this->_refAPPS[$name]; }
    function getTHEMES($name) { return $this->_refTHEMES[$name]; }
    
    // 支持多数据库，根据名称访问数据对象,默认访问default数据库
    function& db($name='default') {
    $db = null;

    // 检测数据库实例是否存在
    if(is_array($this->_oDatabases) 
      && array_key_exists($name, $this->_oDatabases))
    {
      $db = &$this->_oDatabases[$name];
      if( $db != null)
        return $db;
      }

    $dbs = &$this->_refCONFIG['dbs'];
        if(is_array($dbs) && array_key_exists($name, $dbs)) {
      //! 创建数据库实例
      $db = $this->create_database($dbs[$name]);
    }

      return $db;
    }

    function add_dictionary(&$dict) { $this->_refDICT[] = $dict; }
    //function& getDICT() {return $this->_refDICT;}

    function query_dictionary($name, &$dic) {
        foreach($this->_refDICT as $tpl) {
        if($tpl->query_dictionary($name, $dic)) {
          return true;
            }
        }
        
        return false;
    }

    private function create_database($dbcfgs) {
        // print_r($dbcfgs);
    //'type' => 'mysql',
        //'host' => '',
        //'user' => '',
        //'pwd' => '',
        //'dbname' => '',
        //'lang' => '',
        //'prefix' => 'ch_',
    return createdb($dbcfgs['type'], array(
            'host' => $dbcfgs['host'], 
            'user' => $dbcfgs['user'], 
            'pswd' => $dbcfgs['pwd'], 
            'name' => $dbcfgs['dbname'], 
            'prefix' => $dbcfgs['prefix'],
            'lang' => $dbcfgs['lang']
        ));
    }


  private function requireFiles($cfgfile) {
    if(!file_exists($cfgfile)) {
      if(isdebug()) {
        die('file['.$cfgfile.'] not founded.');
      }
    }

    $require_files = require_once($cfgfile);
    if(is_array($require_files)) {
      foreach($require_files as $file) {
        if(file_exists($file)) {
          require_once($file);
        } else {
          require_once($this->getAppRoot().$file);
        }
      }
    }
  }
    
  // appMain入口函数
  function appMain($args) {
    //print_r($_GET);
    global $_PHPKIND_ENVS;
    $module_dir = $_PHPKIND_ENVS['_modulesDir'];
    if(!empty($module_dir))
      $module_dir .= '/';

    // 初始化默认模块
    $default_module_file = 
      $this->getAppRoot().$module_dir.'default.class.php';

    //! 检测文件是否存在, 修复应用程序已经放在command工具里面处理，
    //  加载器不再支持应用程序修复
    //if(!file_exists($default_module_file)) {
    // createfolders($app_root.$module_dir);
    //  if(!copy(_KROOT.'/app_templates/default.class.php', 
    //    $default_module_file)) {
    //    //writelog("restore file error.");
    //    trigger_error('restore file error.', E_USER_ERROR);
    //  }
    //}    
    $module_file = $this->getAppRoot().$module_dir.$this->_module.'.class.php';

    if(!file_exists($module_file))  {
      trigger_error(
        'module ['.$this->_module.'] not exists.', 
        E_USER_ERROR
      );
    }

    // 模块文件
    require_once($module_file);

    // 加载模块
    $class = 'CLASS_MODULE_'.strtoupper($this->_module);
    if(class_exists($class)) {
      $module = new $class;
      $this->moduleCallback($module);
      $module->onInitialize($this);
    } else {
      trigger_error($class. ' is not defined.');
    }  
  }

  function moduleCallback($module) {}

  function& getRefAPPS() {
    return $this->_refAPPS;
  }

  function& getRefTHEMES() {
    return $this->_refTHEMES;
  }

  function& getRefCONFIG() {
    return $this->_refCONFIG;
  }
}

?>
