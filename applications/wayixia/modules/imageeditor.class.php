<?php
if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_IMAGEEDITOR extends CLASS_MODULE {

  public function __construct() {  parent::__construct(); }
  public function CLASS_MODULE_IMAGEEDITOR() { $this->__construct(); }
  
  function doMain($action) {    
    $this->App()->check_user_logon();

    switch($action) {
    case 'edit':
      $this->ui_edit();
      break;
    default:
      parent::doMain($action);
    }
  }

  function ui_edit() {
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('user.image.editor');

    $db = &$this->App()->db();
    $image_id = intval($_GET['id'], 10);

    // check data
    if($image_id == 0)
      trigger_error('invalid image id', E_USER_ERROR);
      
    $sql_get_image = "select I.id AS id, R.file_name, R.width, R.height, I.from_host, I.title, I.album_id  ";
    $sql_get_image.= "from ##__images_resource R, ##__users_images AS I ";
    $sql_get_image.= "where R.id=I.res_id and I.id={$image_id} ";
    $sql_get_image.= "limit 0,1;";

    $image_info = $db->get_row($sql_get_image);  
    if(empty($image_info)) 
      trigger_error('image is not exists', E_USER_ERROR);

    //import template var 
    $t->dump2template($image_info);
    
    // ctrl datasource useralbums
    $sql = "SELECT id as value, name as text FROM  `##__users_albums`";
    $uid = $this->App()->get_user_info('uid');
    if(!empty($uid)) 
      $sql .= " where `uid`='{$uid}'";
    
    $albums = array();
    $db->get_results($sql, $albums);
    array_push($albums, array('value'=>0, 'text'=>'待分类'));
    $t->push_data('useralbums', $albums);

    // render
    $t->display();
  }

//////////////////////// ajax ///////////////////////////////

  function doAjax($action) {
    // 登录
    if(!$this->App()->check_user_logon(false)) {
      $this->AjaxHeader(-2); // 未登录
      $this->AjaxData('not logon');
      return;
    }

    switch($action) {
    case 'edit':
      $this->edit();
      break;
    case 'delete-image':
      $this->delete_image();
      break;
    default:
      parent::doAjax($action);
    }
  }

  function edit() {
    $data = &$_POST['data'];
    $title = $data['title'];
    $id = intval($data['id'], 10);
    $album_id = intval($data['album_id'], 10);
    $uid = $this->App()->get_user_info('uid');
    $db = $this->App()->db();
    
    if(!is_numeric($album_id) || $album_id <= 0) {
      $album_id = -$uid;
    }

    $sql = "UPDATE ##__users_images ";
    $sql.= "set `title`='{$title}',`album_id`='{$album_id}' ";
    $sql.= "where `id`='{$id}';";

    if(!$db->execute($sql)) 
      $this->errmsg($db->get_error());
    if($this->App()->db()->affected_rows() > 0) {
      $this->AjaxHeader(-2);
      return;
    }

    $this->App()->notify('image_move', 
      array(
  'album_id' => $album_id,
  'images' => array($id))
    );
  }

  function delete_image() {
    $data = &$_POST['data'];
    $ablum_id = intval($data['album_id'], 10);
    $pictures = $data['pictures'];
    if(!is_array($pictures))
      $pictures = json_decode(&$data['pictures']);
  
    if(!is_array($pictures) || empty($pictures)) {
      $this->errmsg('invalid parameter: pictures'); 
      return;
    }
    
    if($this->App()->album_is_valid($album_id)) {
      $this->errmsg("not authorized");
      return;
    }

    $db = &$this->App()->db();
    $ids = implode('\',\'', $pictures);
    $sql = "delete from ##__users_images where `id` in ('{$ids}')";
    $db->execute($sql);
    if($db->affected_rows() < 0) {
      $this->AjaxHeader(-2);
      return;
    }

    $this->App()->notify('image_delete', array('images' => $pictures));
  }
}

?>
