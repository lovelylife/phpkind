<?php


function is_badword($string) {
    $badwords = array("\\",'&',' ',"'",'"','/','*',',','<','>',"\r","\t","\n","#");
    foreach($badwords as $value){
      if(strpos($string, $value) !== FALSE) {
        return TRUE;
      }
    }
    return FALSE;
}

function name_is_valid($name) {
  $strlen = strlen($name);
  // 支持数字字母中文和下划线，长度必须大于6
  if(is_badword($name) 
    || !preg_match("/^[a-zA-Z0-9_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]+$/", $name))
  {
    return false;
  } elseif ( 20 < $strlen || $strlen < 6 ) {
    return false;
  }
  
  return true;
}


?>
