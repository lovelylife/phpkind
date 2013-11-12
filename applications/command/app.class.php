<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_COMMAND_APPLICATION extends CLASS_APPLICATION {
    
    function __construct($args) {
        parent::__construct($args);
    }
    
    function CLASS_COMMAND_APPLICATION($args) {
        $this->__construct($args);
    }
    
    function appMain($args) {    
        parent::appMain($args);
    }
}

?>
