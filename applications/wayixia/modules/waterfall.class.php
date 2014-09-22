<?php

class CLASS_MODULE_WATERFALL extends CLASS_MODULE {

  public function __construct() { parent::__construct();  }
  public function CLASS_MODULE_WATERFALL() { $this->__construct(); }

  function doMain($action) {
    switch($action) {
    case 'index':
      $this->index();
      break;
    case 'albums':
      $this->albums();
      break;
    default:
      parent::doMain($action);
    }
  }

  function index() {
    $db = &$this->App()->db();
    $t = new CLASS_TEMPLATES($this->App());

    //$sql = "select distinct(file_name), server, file_name, (height*192/width*1.0) as height, id, uid as ownerid, uname as owner, album_name, album_id, title, DATE_FORMAT(create_time, '%Y-%m-%d') as create_time ";
    //$sql.= "from ##__nosql_pins group by file_name ";
    //$sql.=" order by id DESC ";
      
    //$page_size = 10;
    //$count_sql =  "select sum(size) totalsize from ";
    //$count_sql.= "(select count(distinct file_name) size from ##__nosql_pins group by file_name) d; ";
      
    //$count_row = $this->App()->db()->get_row($count_sql);
    //if(empty($count_row)) {
    //  $totalsize = 0;
    //} else {
    //  $totalsize = $count_row['totalsize'];
    //}


    // images data
    $pins_model = new pins_model();
    $pins_model->limit($pins_model->total_size($db), 10, $_GET['p']);
    $pins_model->groupby("file_name")->orderby('id', false);

    $images = array();
    $db->get_results($pins_model->sql(), $images);
    $t->push_data('imagesdata', $images);
    
    // 显示界面
    $t->render('waterfall/index');

  }

  function albums() { 
    $t = new CLASS_TEMPLATES($this->App());
    $db = &$this->App()->db();
    $album_id = intval($_GET['id'], 10);
    
    // images data
    $pins_model = new pins_model();
    $pins_model->limit($pins_model->total_size($db), 10, $_GET['p']);
    $pins_model->where("album_id={$album_id} and album_id>0 ");

    $images = array();
    $db->get_results($pins_model->sql(), $images);
    //print_r($images);
    $t->push_data('imagesdata', $images);
    // 显示界面
    $t->render('waterfall/albums');
  }
}

?>
