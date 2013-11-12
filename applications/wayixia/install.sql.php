<?php die("access denied!"); /*

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

DROP TABLE IF EXISTS `{$prefix}images`;
CREATE TABLE {$prefix}images (
  `id` int(10) unsigned NOT NULL auto_increment,
  `owner` int(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_name` varchar(255) default NULL,
  `src` varchar(255) NOT NULL,
  `width` int(2) NOT NULL default '100',
  `height` int(2) NOT NULL default '200',
  `from_domain` varchar(255) NOT NULL,
  `from_protocol` varchar(32) NOT NULL default 'http:',
  `from_page` varchar(255) NOT NULL,
  `status` varchar(32) character set utf8 collate utf8_bin NOT NULL,
  `create_time` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS {$prefix}tags;
CREATE TABLE {$prefix}tags (
  name varchar(32) NOT NULL default '',
  image_id mediumint(8) unsigned NULL ,
  pubdate date NOT NULL default '0000-00-00',
  description text NOT NULL,
  img varchar(255) NOT NULL default '',
  PRIMARY KEY (`name`)
) TYPE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `{$prefix}users`;
CREATE TABLE {$prefix}users (
  `uid` int(12) unsigned NOT NULL auto_increment COMMENT '用户ID',
  `name` varchar(64) default NULL COMMENT '用户名',
  `pwd` varchar(32) default NULL COMMENT '密码',
  `nickname` varchar(32) NOT NULL default '新手',
  `email` varchar(128) default NULL COMMENT 'E-MAIL',
  `authority_type` int(4) NOT NULL default '0' COMMENT '用户权限类型',
  `pwd_question` varchar(255) default NULL COMMENT '取回密码问题',
  `pwd_answer` varchar(255) default NULL COMMENT '答案',
  `join_time` timestamp NOT NULL default CURRENT_TIMESTAMP COMMENT '注册时间',
  `join_ip` varchar(20) default NULL COMMENT '昵称',
  `islocked` tinyint(2) NOT NULL default '1' COMMENT '用户是否被锁定',
  `lastlogin_time` int(11) default NULL COMMENT '上次登陆时间',
  `lastlogin_ip` varchar(20) default NULL COMMENT '上次登陆ip地址',
  `icon` varchar(255) default NULL COMMENT '头像',
  PRIMARY KEY  (`uid`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `{$prefix}users_forgetpwd`;
CREATE TABLE  `{$prefix}users_forgetpwd` (
  `authkey` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `email` varchar(128) NOT NULL,
  `createtime` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  PRIMARY KEY   (`authkey`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='用于密码找回';

#*/
?>
