<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_PUBLIC extends CLASS_MODULE {

    public function __construct() {
        parent::__construct();
    }

    public function CLASS_MODULE_PUBLIC() {
        $this->__construct(); 
    }

    function doMain($action) {
      switch( $action) {
      case 'dis':
        $this->execute_tasks();
        break;
      default:
        $this->index();
      }
    }

    function doAjax($action) {
      switch($action) {
      case 'public-album':
        $this->public_album();
        break;

      case 'get-zol-images-list':
        $this->get_zol_images_list();
        break;

      case 'get-image-url':
        $this->get_image_url();
        break;

      default:
        parent::doAjax($action);
      }

      
    }

    function index() {
      try {
        $db = $this->App()->db();
        // get public data
        $from_url = $_GET['from_url'];
	$sql = "select I.imgSrc, I.pageUrl, I.title, A.public_id as album_id, A.title as albumtitle ";
	$sql.= "from ##__prepublic_images AS I ";
	$sql.= "left join ##__album_urls AS A ";
	$sql.= "on A.from_url=I.album_from_url ";
	$sql.= "where I.album_from_url='{$from_url}' ";
        //echo $sql; 
        $page_size = 15;
        $totalsize = $db ->query_count($sql);
        
        $cfg = array(
          "totalsize" => $totalsize,
          "pagesize" => $page_size,
          "pagekey" => "p",
        );

        // 实例化分页类,初始化构造函数中的总条目数和每页显示条目数
        $pager = new CLASS_PAGE($cfg);
        $sql .= $pager->getSQLPage();
        $rs = array();
        $db->get_results($sql, $rs);

        $t = new CLASS_TEMPLATES($this->App());
        $t->push_data('publicdata', $rs);
        $t->push('pager', $pager->__toString());
        $t->push('title', $rs[0]['albumtitle']);

        $t->render('public');
      } catch(Exception $e) {
        print_r($e);
      }
    }

    function public_album() {
      $task = $_POST['data'];
      $this->AjaxData($task);
    }
}

?>
