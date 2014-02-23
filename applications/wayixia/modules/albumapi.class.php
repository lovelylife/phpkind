<?php


class CLASS_MODULE_ALBUMAPI extends CLASS_MODULE
{
  public function __construct() { parent::__construct(); }
  public function CLASS_MODULE_ALBUMAPI() { $this->__construct(); }

  function doAjax($action) {
    switch($action) {
    case 'add':
      $this->add_album();
      break;  
    default:
      return parent::doAjax($action);
    }
  }    

  // add album
  function add_album() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $user_id = $theApp->get_user_info('uid');
    // 重复登录
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // 未登录
      $this->AjaxData('请先登录！');
      return;
    }

    $task_data = &$_POST['data'];    
    $album_name = $task_data['title'];
    if(empty($album_name)) {
      $this->errmsg('name is empty');
      return;
    }

    $db = $this->App()->db();
    $sqlcheck = "select `id` from `##__users_albums` where `uid`={$user_id} and `name`='{$album_name}' limit 0,1;";
    $row = $db->get_row($sqlcheck);
    if(!empty($row)) {
      $this->AjaxData($row['id']);
      return;
    }

    $fields = array(
      'uid' => $user_id,
      'name' => $album_name,
      'classname' => $album_class,
      'description'=>$description,
    );
    $sql = $db->insertSQL('users_albums', $fields);
    $result = $db->execute($sql);
    if(!$result) 
      $this->errmsg($db->get_error());

    $this->AjaxData($db->get_insert_id());
  }

}

?>
