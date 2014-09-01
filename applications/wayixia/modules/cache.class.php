<?php

class combine_files {
  private $files_;
  function __construct() {  $this->files_ = array(); }
  function combine_files() { $this->__construct(); }

  function append($file_name) {
    array_push($this->files_, $file_name); 
  }

  function output($file_name) {
    $f = fopen($file_name, 'w');
    if($f) {
      foreach($this->files_ as $file_item) {
        $name = "/*************** import file ".basename($file_item) . "***************/\r\n";
        $file_data = file_get_contents($file_item);
	if($file_data) {
	  fwrite($f, $name);
	  fwrite($f, $file_data);
	} else {
	  echo "$file_item read error";
	}  
      }
      fclose($f);
    }
  }
}


class CLASS_MODULE_CACHE extends CLASS_MODULE {

  function __construct() { parent::__construct(); }
  function CLASS_MODULE_CACHE() { $this->__construct(); }
  
  function doMain($action) {
    if(method_exists($this, $action)) {
      $this->$action();
    } else {
      parent::doMain($action);
    }
  }

  function css() {
    $resource_dir = $this->App()->getAppRoot().$this->App()->getTHEMES('path');
    $c = new combine_files;
    $c->append($resource_dir.'/layout.css');
    $c->append($resource_dir.'/skin.css');
 
    // write to cache file
    $output_file = $resource_dir.'/style.c.css';
    $c->output($output_file);

    // echo to browser
    echo file_get_contents($output_file);
  }

  function js() {
    $resource_dir = $this->App()->getAppRoot().$this->App()->getTHEMES('path');
    $c = new combine_files;
    $c->append(_QROOT.'/../qlib/Q.js');
    $c->append(_QROOT.'/../qlib/utils/stl.js');
    $c->append(_QROOT.'/../qlib/utils/xml.js');
    $c->append(_QROOT.'/../qlib/utils/json2.js');
    $c->append(_QROOT.'/../qlib/utils/ajax.js');
    $c->append(_QROOT.'/../qlib/ui/wndx-1-0-2.js');
    $c->append(_QROOT.'/../qlib/utils/tween.js');
    $c->append(_QROOT.'/../qlib/ui/calendar.js');
    $c->append(_QROOT.'/../qlib/ui/wndx-1-0-2.js');
    $c->append($resource_dir.'/waterfall.js');
    $c->append($resource_dir.'/common.js');

    // write to cache file
    $output_file = $resource_dir.'/Q.js';
    $c->output($output_file);

    // echo to browser
    echo file_get_contents($output_file);
 
  }
}

?>
