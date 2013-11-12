<?php die("access denied!"); /*

DROP TABLE IF EXISTS `{$prefix}images`;
CREATE TABLE {$prefix}images (
  `id` int(10) unsigned NOT NULL auto_increment,
  `album_id` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `src` varchar(255) NOT NULL,
  `width` int(2) NOT NULL default '100',
  `height` int(2) NOT NULL default '200',
  `from_domain` varchar(255) NOT NULL,
  `from_protocol` varchar(32) NOT NULL default 'http:',
  `from_page` varchar(255) NOT NULL,
  `create_time` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `{$prefix}admin`;
CREATE TABLE {$prefix}admin (
  `uid` int(8) unsigned NOT NULL auto_increment,
  `uname` varchar(30) NOT NULL,
  `pwd` varchar(64) NOT NULL,
  `nickname` varchar(30) default NULL,
  `rights` text,
  `group_id` int(4) default NULL COMMENT '电子邮件',
  `tel` varchar(16) default NULL COMMENT '联系电话',
  `loginip` varchar(20) default NULL COMMENT '登陆ip',
  `logintime` int(8) default NULL COMMENT '登陆时间',
  `email` varchar(128) default NULL,
  `createtime` int(8) default NULL,
  PRIMARY KEY  (`uid`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `{$prefix}usergroup`;
CREATE TABLE {$prefix}usergroup (
  `group_id` int(4) NOT NULL auto_increment COMMENT '用户组ID',
  `group_name` varchar(32) NOT NULL COMMENT '用户组名称',
  `rights` text COMMENT '权限集合',
  PRIMARY KEY  (`group_id`,`group_name`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

INSERT INTO `{$prefix}usergroup` (`group_id`,`group_name`,`rights`) VALUES('1','系统管理员','00,02,03,04,05,06,07,08,09,10,11,12,14,15,17,18,19,20,21,22,23,24');

#*/
?>
