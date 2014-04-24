<?php

class CLASS_MODULE_WATERFALL extends CLASS_MODULE {

  public function __construct() { parent::__construct();  }
  public function CLASS_MODULE_WATERFALL() { $this->__construct(); }

  function doMain($action) {
    switch($action) {
    case 'index':
      $this->index();
      break;
    default:
      parent::doMain($action);
    }
  }

  function index() {
    $db = &$this->App()->db();

    $sql = "select distinct(file_name), server, file_name, (height*192/width*1.0) as height, id, uname as owner, title, DATE_FORMAT(create_time, '%Y-%m-%d') as create_time ";
    $sql.= "from ##__nosql_pins group by file_name ";
    $sql.=" order by id DESC ";
      
    $page_size = 10;
    $count_sql =  "select sum(size) totalsize from ";
    $count_sql.= "(select count(distinct file_name) size from ##__nosql_pins group by file_name) d; ";
      
    $count_row = $this->App()->db()->get_row($count_sql);
    if(empty($count_row)) {
      $totalsize = 0;
    } else {
      $totalsize = $count_row['totalsize'];
    }
    //print_r($count_row);
    $cfg = array(
        "totalsize" => $totalsize,
        "pagesize" => $page_size,
        "pagekey" => "p",
        "html" => true,
        "tpl" => "/index/".urlencode($tag)."{pid}",
    );

    // 实例化分页类,初始化构造函数中的总条目数和每页显示条目数
    $pager = new CLASS_PAGE($cfg);
      
    $sql .= $pager->getSQLPage();

    $rs = array();
    $db->get_results($sql, $rs);

    $t = new CLASS_TEMPLATES($this->App());
    /*
    if(empty($rs)) {
      $t->push('images_data', '[]');
    } else {
      $t->push('images_data', json_encode($rs));
    } 
     */

    $t->push_data('imagesdata', $rs);
    //$t->push('tag', $tag);
    //$t->push('pager', $pager->__toString());

    // 显示界面
    $t->render('waterfall/index');

  }
}

?>
