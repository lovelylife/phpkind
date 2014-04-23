<?php

class CLASS_MODULE_HELPER extends CLASS_MODULE {

  function __construct() { parent::__construct(); }

  function CLASS_MODULE_HELPER() { $this->__construct(); }

  function doMain($action) {
    switch($action) {
    case 'install':
      $this->install();
      break;
    default:
      $this->index();
    }
  }


  function index() {
    try {
      $t = new CLASS_TEMPLATES($this->App());
      $t->render('helper.index');
    } catch(Exception $e) {
      print_r($e);
    }
  }

  function install() {
    $t = new CLASS_TEMPLATES($this->App());
    $t->render('helper.install');
  }
}

?>
