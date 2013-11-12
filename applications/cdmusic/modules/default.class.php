<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_DEFAULT extends CLASS_MODULE {

    public function __construct() {
	    parent::__construct();
    }

    public function CLASS_MODULE_DEFAULT() { 
	    $this->__construct(); 
	}

    function doMain($action) {
		$this->index();
    }
    
    function doAjax($action) {
	    // ajax data
	    $data = &$this->request['data'];

		// ajax action
	    switch($action) {
		case 'action1':
		    break;
        }
    }

	function index() {
	    //! Æô¶¯Ä¬ÈÏÊ×Ò³
        try {
		   //$db = $this->App()->db();
		   //print_r($db);
		   //$rs = $db->doQuery("select * from ##__singertype");
		   //print_r($rs);

           $t = new CLASS_TEMPLATES($this->App());
           $t->render('index');
        } catch(Exception $e) {
           print_r($e);
        }
	}
}

?>