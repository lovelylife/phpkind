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
    $ajax_data = &$this->request['data'];

    // ajax action
    switch($action) {
    case 'action1':
      $this->AjaxData('your ajax request is ok.');
      break;
    }
  }

  function index() {
    try {
      $t = new CLASS_TEMPLATES($this->App());
      $t->load('index');
      $t->push('test_select', 3);
      //$tag = $t->tag('test_select');

      //$sql="SELECT  `uname` as value ,  `email` as text FROM  `dede_member` where `email` !='' ";
      #$sql = "select `id` as text, `url` as value from c_table_3";
      //$this->App()->db()->get_results($sql, $rs);

      // array data
      $mydata = array(
        array('value'=>'v1', 'text'=>'text1', ),
        array('value'=>'v2', 'text'=>'text2', ),
        array('value'=>'v3', 'text'=>'text3', ),
        array('value'=>'v4', 'text'=>'text4', ),
      );
      $t->push_data('mydata', $mydata);
      $t->display();
    } catch(Exception $e) {
      print_r($e);
    }
  }
}

?>
