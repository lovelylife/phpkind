<?php


/*--------------------------------------------------------------------
 $ module: CORE APPLICATION MODULE FRAMEWORK For PHPKind
 $ date:   2009-11-10 21:23:28
 $ author: LovelyLife
 $ last modified: 2012-04-24 12:47:47
 $ copyright www.onlyaa.com
----------------------------------------------------------------------*/

class CLASS_MODULE {
  // 应用程序实例
  private $app_;
  // Ajax请求数据
  public $request;    
  // Ajax应答数据
  private $response;      
  // Ajax错误返回信息
  public $errmsgs;

  // 构造函数
  function __construct() { 
    $this->request = &$_POST; 
    $this->response = null;    
    $this->errmsgs = array();
  }
     
  // 构造函数
  function CLASS_MODULE(){  $this->__construct();  }

  function onInitialize(&$theApp) {
    $this->app_ = $theApp;
    // 模块毁掉预处理
    
    // 入口函数
    if($theApp->inAjax()) {
      $this->__doajax();
    } else {
      $this->__domain();
    }
  }
    
  // Ajax模式入口
  function __doajax() {
    header('Content-Type: text/html; charset=utf-8'); 
    // 应答包
    $this->response = new CLASS_AJAX_PACKAGE();
    $this->response->set_header(0);        // 正确应答包
    $this->doAjax($this->App()->getAction());
    
    echo $this->response->__toString();
  }
    
  // 非Ajax模式入口
  function __domain() {
    $this->doMain($this->App()->getAction());
  }
    
  // 多态接口，用于处理普通表单的提交的请求
  function doMain($action) {
    trigger_error('ui mode: action"'.$action.'" is not supported .', E_USER_ERROR);
  }

  // 默认提示
  function doAjax($action) {
    $this->errmsg('ajax mode: action"'.$action.'" is not supported. ');
  }
 
  // Ajax Header Set
  function AjaxHeader($header) {
    if(!$this->IsAjax()) {
      trigger_error('not ajax mode', E_USER_ERROR);
    }        
    $this->response->set_header($header);            
  }
    
  // Ajax Data Set       
  function AjaxData($data) {
    if(!$this->IsAjax()) {
      trigger_error('not ajax mode', E_USER_ERROR);
    }
    $this->response->set_data($data);          
  }
    
  // Ajax Extra Set         
  function AjaxExtra($extra) {
    if(!$this->IsAjax()) {
      trigger_error('not ajax mode', E_USER_ERROR);
    }  
    $this->response->set_extra($extra);
  }

  // 错误消息处理
  function errmsg($str) {
    $this->errmsgs[] = $str;
    if($this->IsAjax()) {
      $this->AjaxHeader(-1);
      $this->AjaxData($this->errmsgs);
    }
  }

  function& App() {
    return $this->app_;
  }

  function Config($cfg_name) {
    return $this->app_->Config($cfg_name);
  }

  function IsAjax() {
    return $this->app_->InAjax();
  }
}

?>
