<?php die("access denied!"); /*

CREATE TABLE IF NOT EXISTS `ch_distributed_server` (
  `name` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ch_images_resource` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `creator_uid` int(11) NOT NULL,
  `server` varchar(255) NOT NULL,
  `file_name` varchar(255) default NULL,
  `src` varchar(255) NOT NULL,
  `width` int(2) default NULL,
  `height` int(2) default NULL,
  `status` varchar(32) character set utf8 collate utf8_bin NOT NULL,
  `create_time` timestamp NOT NULL default '0000-00-00 00:00:00',
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `ch_login_users` (
  `uid` int(10) unsigned NOT NULL,
  `endpoint` varchar(128) NOT NULL,
  `login_time` timestamp NOT NULL default CURRENT_TIMESTAMP,
  `login_ip` varchar(20) NOT NULL,
  `nid` varchar(32) NOT NULL,
  PRIMARY KEY  (`uid`,`endpoint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ch_system_count` (
  `app` varchar(32) NOT NULL,
  `module` varchar(64) NOT NULL,
  `action` varchar(64) NOT NULL,
  `create_time` timestamp NOT NULL default CURRENT_TIMESTAMP,
  `referer` text NOT NULL,
  `ip` varchar(16) NOT NULL,
  `data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ch_tags` (
  `name` varchar(32) NOT NULL default '',
  `image_id` mediumint(8) unsigned default NULL,
  `pubdate` date NOT NULL default '0000-00-00',
  `description` text NOT NULL,
  `img` varchar(255) NOT NULL default '',
  PRIMARY KEY  (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `ch_usergroup` (
  `group_id` int(4) NOT NULL auto_increment COMMENT '用户组ID',
  `group_name` varchar(32) NOT NULL COMMENT '用户组名称',
  `rights` text COMMENT '权限集合',
  PRIMARY KEY  (`group_id`,`group_name`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

CREATE TABLE IF NOT EXISTS `ch_users` (
  `uid` int(12) unsigned NOT NULL auto_increment COMMENT '用户ID',
  `name` varchar(64) default NULL COMMENT '用户名',
  `pwd` varchar(32) default NULL COMMENT '密码',
  `email` varchar(128) default NULL COMMENT 'E-MAIL',
  `authority_type` int(4) NOT NULL default '0' COMMENT '用户权限类型',
  `pwd_question` varchar(255) default NULL COMMENT '取回密码问题',
  `pwd_answer` varchar(255) default NULL COMMENT '答案',
  `join_time` timestamp NOT NULL default CURRENT_TIMESTAMP COMMENT '注册时间',
  `join_ip` varchar(20) default NULL COMMENT '昵称',
  `islocked` tinyint(2) NOT NULL default '1' COMMENT '用户是否被锁定',
  `lastlogin_time` int(11) default NULL COMMENT '上次登陆时间',
  `lastlogin_ip` varchar(20) default NULL COMMENT '上次登陆ip地址',
  `nickname` varchar(32) NOT NULL default '新手',
  `gender` tinyint(2) NOT NULL default '1',
  `bothday` date NOT NULL default '0000-00-00',
  `description` varchar(128) NOT NULL,
  PRIMARY KEY  (`uid`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=30 ;

CREATE TABLE IF NOT EXISTS `ch_users_albums` (
  `id` int(10) NOT NULL auto_increment,
  `classname` varchar(32) NOT NULL,
  `uname` varchar(64) NOT NULL,
  `albumname` varchar(128) NOT NULL,
  `description` varchar(255) NOT NULL,
  `cover` varchar(128) NOT NULL,
  `create_time` timestamp NOT NULL default CURRENT_TIMESTAMP,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=15 ;

CREATE TABLE IF NOT EXISTS `ch_users_forgetpwd` (
  `authkey` varchar(64) NOT NULL,
  `email` varchar(128) NOT NULL,
  `name` varchar(64) NOT NULL,
  `createtime` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  PRIMARY KEY  USING BTREE (`authkey`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='用于密码找回';

CREATE TABLE IF NOT EXISTS `ch_users_images` (
  `id` int(12) unsigned zerofill NOT NULL auto_increment,
  `uid` int(11) NOT NULL,
  `res_id` int(10) unsigned NOT NULL,
  `album_id` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `create_date` timestamp NOT NULL default CURRENT_TIMESTAMP,
  `from_host` varchar(128) NOT NULL,
  `from_url` varchar(2048) NOT NULL,
  `agent` varchar(32) NOT NULL default 'chrome' COMMENT '整数则来自本站，字符串则表示来源插件类型',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=443 ;

CREATE TABLE IF NOT EXISTS `ch_users_openapi` (
  `uid` int(12) NOT NULL,
  `type` varchar(32) NOT NULL,
  `value` varchar(128) NOT NULL,
  PRIMARY KEY  (`type`,`value`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

#*/
?>
