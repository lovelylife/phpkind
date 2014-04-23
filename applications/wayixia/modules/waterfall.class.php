<?php

class CLASS_MODULE_DEFAULT extends CLASS_MODULE {

  public function __construct() { parent::__construct();  }
  public function CLASS_MODULE_DEFAULT() { $this->__construct(); }

  function doAjax($action) {
    switch($action) {
    case 'index':
      $this->ajax_index();
      break;
    default:
      parent::doAjax($action);
    }
  }

  function ajax_index() {

  }

?>
