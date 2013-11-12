<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_TASKMANAGE extends CLASS_MODULE {

    public function __construct() {
        parent::__construct();
    }

    public function CLASS_MODULE_TASKMANAGE() {
        $this->__construct(); 
    }

    function doMain($action) {
      switch( $action) {
      case 'tasklist':
        break;
	  case 'execute-tasks':
		  $this->execute_tasks();
		  break;
      default:
        $this->index();
      }
    }

    function doAjax($action) {
    // ajax action
      switch($action) {
      case 'getlist':
        $this->getlist();
        break;
      }
    }

    function index() {
        try {
           $t = new CLASS_TEMPLATES($this->App());
           $t->render('index');
        } catch(Exception $e) {
           print_r($e);
        }
    }

    function getlist() {
      $data = &$_POST['data'];
      $url = $data['url'];
     
    }

	function execute_tasks() {
		
	}
}

?>
