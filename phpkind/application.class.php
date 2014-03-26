<?php
/*--------------------------------------------------------------------
 $ file: application.php
 $ date: 2010-8-22 00:24:26
 $ last modify: 2012-07-23 12:59:40
 $ author: LovelyLife 
 $ 应用程序框架
 ----------------------------------------------------------------------*/

// 应用程序基类
class CLASS_APPLICATION {
  // application 环境
  private $root_;
  private $path_;
  private $host_;

  // 模块操作
  protected $module_;
  protected $inajax_;

  // 数据库集合
  private $databases_;
    
  // 路径
  private $path_log_;
  private $path_template_;
  private $path_cache_;
  private $path_data_;
  private $path_themes_;
  private $theme_;
        
  // 模板里的变量名称映射
  private $_refCONFIG;
  private $_refAPPS;
  private $_refTHEMES;    
  private $_refDICT;

  function __construct() {
    //! 初始化应用程序环境
    $this->_refTHEMES  = array();
    $this->_refAPPS = array();
    $this->_refDICT = array();
    $this->databases_ = array();
  }

  function CLASS_APPLICATION($args = array()) { $this->__construct($args); }
 
  function initialize($args) {    
    $this->root_ = $args['root'];
    $this->path_ = $args['path'];
    $this->host_ = $args['host'];

    $this->module_ = $args['module'];  
    $this->inajax_ = $args['inajax'];

    // 注册模板变量 
    $this->_refAPPS['path']  = $this->path_;
    $this->_refAPPS['app']   = $this->host_.$this->path_;
    $this->_refAPPS['module']= $this->_refAPPS['app'] .'?'. 'mod='. $this->_module;
    $this->_refAPPS['host']  = &$this->host_;
    // 导入配置数据
    $this->_refCONFIG = require_file($this->root_.'/config.php');
    // 初始化资源和主题路径
    // 导入设置
    $paths = &$args['settings'];
    if(is_array($paths)) {
      $this->path_template_ = 
        empty($paths['templates']) ? '/templates' : $paths['templates'];
      $this->path_cache_ = 
        empty($paths['cache_dir']) ? '/cache' : $paths['cache_dir'];
      $this->path_data_ = 
        empty($paths['data_dir']) ? '/data' : $paths['data_dir'];
      $this->path_themes_ = 
        empty($paths['theme_dir']) ? '/themes' : $paths['theme_dir'];
      $this->theme_ = 
        empty($paths['theme_current']) ? '/default' : $paths['theme_current'];
    }

    // 初始化当前使用皮肤
    if(isset($_COOKIE['theme'])) {
      $this->theme_ = $_COOKIE['theme'];
    } else {
      $_COOKIE['theme'] = $this->theme_;
    }
    // 取消了js,images,css这些目录，直接使用theme目录
    $this->_refTHEMES['path'] = ($this->path_ == '/'?'':$this->path_).$this->path_themes_.$this->theme_; 
    //print_r($this->_refTHEMES); 
    // 导入包含文件
    $this->requireFiles($this->root_.'/includes.required.php');
  }

  // appMain入口函数
  function appMain($args) {
    // 初始化环境
    $this->initialize($args);
    // 初始化默认模块
    $default_module_file = $this->getAppRoot().'/modules/default.class.php';
    $module_file = $this->getAppRoot().'/modules/'.$this->module_.'.class.php';
    if(!file_exists($module_file))  
      trigger_error('module ['.$this->module_.'] not exists.', E_USER_ERROR);

    // 模块文件
    require_file($module_file);

    // 加载模块
    $class = 'CLASS_MODULE_'.strtoupper($this->module_);
    if(class_exists($class)) {
      $module = new $class;
      $this->moduleCallback($module);
      $module->onInitialize($this);
    } else {
      trigger_error($class. ' is not defined.');
    }  
  }
  
  //! operations
  function getAppRoot() { return $this->root_; }
  function getAppPath() { return $this->path_; }
  function getUrlApp()  { return $this->_refAPPS['app'];}
  function getUrlModule() { return $this->_refAPPS['module'];}
  function getAppLogPath() { return $this->path_log_; }
  function getTemplatesPath() {return $this->path_template_; }
  function getDataPath()   { return $this->path_data_; }
  function getCachePath()  { return $this->path_cache_; }
  function getTheme()       { return $this->theme_; }
  function getDefaultTheme(){ return '/default'; }
  function inAjax()      { return $this->inajax_; }
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
    
    
  // 支持多数据库，根据名称访问数据对象,默认访问default数据库
  function& db($name='default') {
    $db = null;

    // 检测数据库实例是否存在
    if(is_array($this->databases_) 
      && array_key_exists($name, $this->databases_))
    {
      $db = &$this->databases_[$name];
      if( $db != null)
        return $db;
    }

    $dbs = &$this->_refCONFIG['dbs'];
    if(is_array($dbs) && array_key_exists($name, $dbs)) {
      // 创建数据库实例
      $db = $this->create_database($dbs[$name]);
    }

    return $db;
  }

  function add_dictionary(&$dict) { $this->_refDICT[] = $dict; }

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

    $require_files = require_file($cfgfile);
    if(is_array($require_files)) {
      foreach($require_files as $file) {
        if(file_exists($file)) {
          require_file($file);
        } else {
          require_file($this->getAppRoot().$file);
        }
      }
    }
  }
    
  function moduleCallback($module) {}
  function getAPPS($name)   { return $this->_refAPPS[$name]; }
  function getTHEMES($name) { return $this->_refTHEMES[$name]; }
  function& getRefAPPS()    { return $this->_refAPPS; }
  function& getRefTHEMES()  { return $this->_refTHEMES; }
  function& getRefCONFIG()  { return $this->_refCONFIG; }
}

?>
