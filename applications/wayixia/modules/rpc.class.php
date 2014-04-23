<?php

class CLASS_MODULE_RPC extends CLASS_MODULE {

  function __construct() { parent::__construct(); }

  function CLASS_MODULE_RPC() { $this->__construct(); }

  function doMain($action) {
		$t = new CLASS_TEMPLATES($this->App());
		$t->render('rpc');
  }
}

?>
