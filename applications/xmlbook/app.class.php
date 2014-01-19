<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_XMLBOOK_APPLICATION extends CLASS_APPLICATION {
    
    private $_RIGHTSTABLE;
    private $_USERCONTEXT;
    
    function __construct($args) {
        parent::__construct($args);
    }
    
    function CLASS_XMLBOOK_APPLICATION($args) {
        $this->__construct($args);
    }
    
    function appMain($args) {
      parent::appMain(args);
    }
    
    function& getUserRightsTable() {
        return $this->_RIGHTSTABLE;
    }
}

?>
