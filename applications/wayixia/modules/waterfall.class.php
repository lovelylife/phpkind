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

    $sql = "select distinct(file_name), server, file_name, (height*192/width*1.0) as height, id, uid as ownerid, uname as owner, album_name, album_id, title, DATE_FORMAT(create_time, '%Y-%m-%d') as create_time ";
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
    $t->push_data('imagesdata', $rs);

    // 显示界面
    $t->render('waterfall/index');

  }

  function albums() { 
    $t = new CLASS_TEMPLATES($this->App());
    $db = &$this->App()->db();
    $album_id = intval($_GET['aid'], 10);

    $sql = "select distinct(file_name), server, file_name, (height*192/width*1.0) as height, id, uid as ownerid, uname as owner, album_name, album_id, title, DATE_FORMAT(create_time, '%Y-%m-%d') as create_time ";
    $sql.= "from ##__nosql_pins ";
    $sql.= "where album_id={$album_id} ";
    $sql.= "group by file_name ";
    $sql.= "order by id DESC ";

    if(empty($count_row)) {
      $totalsize = 0;
    } else {
      $totalsize = $count_row['totalsize'];
    }
    $cfg = array(
        "totalsize" => $totalsize,
        "pagesize" => $page_size,
        "pagekey" => "p",
        "html" => true,
        "tpl" => "/index/".urlencode($tag)."{pid}",
    );
    $pager = new CLASS_PAGE($cfg);
    $size = $pager->getPageSize();
    if(intval($_GET['p'],10) > $size) {
      return;
    }
    // 实例化分页类,初始化构造函数中的总条目数和每页显示条目数
    $pager = new CLASS_PAGE($cfg);
    $sql .= $pager->getSQLPage();
    $images = array();
    $db->get_results($sql, $images);
    $t->push_data('imagesdata', $images);

    // 显示界面
    $t->render('waterfall/albums');
  }
}

?>
