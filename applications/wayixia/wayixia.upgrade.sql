-- phpMyAdmin SQL Dump
-- version 3.5.5
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2014 年 01 月 01 日 15:39
-- 服务器版本: 5.0.51a-community-nt
-- PHP 版本: 5.2.6

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- 数据库: `wayixia`
--

-- --------------------------------------------------------

--
-- 表的结构 `ch_admin`
--

CREATE TABLE `ch_admin` (
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
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_album_class`
--

CREATE TABLE `ch_album_class` (
  `name` varchar(32) NOT NULL,
  `orders` int(4) NOT NULL,
  PRIMARY KEY  (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_distributed_server`
--

CREATE TABLE `ch_distributed_server` (
  `name` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_follow_albums`
--

CREATE TABLE `ch_follow_albums` (
  `album_id` int(11) NOT NULL,
  `uid` int(11) NOT NULL,
  PRIMARY KEY  (`album_id`,`uid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_follow_users`
--

CREATE TABLE `ch_follow_users` (
  `uid` int(11) NOT NULL,
  `follow_uid` int(11) NOT NULL,
  PRIMARY KEY  (`uid`,`follow_uid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_images`
--

CREATE TABLE `ch_images` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `uid` int(11) NOT NULL,
  `src` varchar(255) NOT NULL,
  `from_domain` varchar(255) NOT NULL,
  `from_protocol` varchar(32) default NULL,
  `from_page` varchar(255) default NULL,
  `status` varchar(32) character set utf8 collate utf8_bin NOT NULL,
  `create_time` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_images_resource`
--

CREATE TABLE `ch_images_resource` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `creator_uid` int(11) NOT NULL,
  `server` varchar(255) NOT NULL,
  `file_name` varchar(255) default NULL,
  `file_type` varchar(64) NOT NULL default '".jpeg"',
  `file_size` int(11) NOT NULL default '0',
  `src` varchar(255) NOT NULL,
  `width` int(2) default NULL,
  `height` int(2) default NULL,
  `status` varchar(32) character set utf8 collate utf8_bin NOT NULL,
  `create_time` timestamp NOT NULL default '0000-00-00 00:00:00',
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_login_users`
--

CREATE TABLE `ch_login_users` (
  `uid` int(10) unsigned NOT NULL,
  `endpoint` varchar(128) NOT NULL,
  `login_time` timestamp NOT NULL default CURRENT_TIMESTAMP,
  `login_ip` varchar(20) NOT NULL,
  `nid` varchar(32) NOT NULL,
  PRIMARY KEY  (`uid`,`endpoint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_nosql_albums_recommend`
--

CREATE TABLE `ch_nosql_albums_recommend` (
  `album_id` int(12) NOT NULL,
  `uid` int(11) NOT NULL,
  `uname` varchar(64) NOT NULL,
  `num_images` int(8) NOT NULL,
  `album_name` varchar(64) NOT NULL,
  `album_description` varchar(255) NOT NULL,
  `data_images` text NOT NULL,
  PRIMARY KEY  (`album_id`),
  KEY `album_id` (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_nosql_pins`
--

CREATE TABLE `ch_nosql_pins` (
  `id` int(12) unsigned NOT NULL,
  `uid` int(11) NOT NULL,
  `uname` varchar(64) NOT NULL,
  `album_id` int(10) unsigned NOT NULL,
  `album_name` varchar(64) NOT NULL,
  `width` int(2) NOT NULL,
  `height` int(2) NOT NULL,
  `title` varchar(255) NOT NULL,
  `create_time` timestamp NOT NULL default CURRENT_TIMESTAMP,
  `from_host` varchar(128) NOT NULL,
  `from_url` varchar(2048) NOT NULL,
  `agent` varchar(32) NOT NULL default 'chrome' COMMENT '整数则来自本站，字符串则表示来源插件类型',
  `creator_uid` int(11) NOT NULL,
  `src` varchar(255) NOT NULL,
  `server` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(64) NOT NULL,
  `file_size` int(11) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_nosql_users_recommend`
--

CREATE TABLE `ch_nosql_users_recommend` (
  `uid` int(12) unsigned NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(128) NOT NULL,
  `num_images` int(10) unsigned NOT NULL,
  `num_albums` int(10) unsigned NOT NULL,
  `data_albums` text NOT NULL,
  PRIMARY KEY  (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- 表的结构 `ch_system_count`
--

CREATE TABLE `ch_system_count` (
  `app` varchar(32) NOT NULL,
  `module` varchar(64) NOT NULL,
  `action` varchar(64) NOT NULL,
  `create_time` timestamp NOT NULL default CURRENT_TIMESTAMP,
  `referer` text NOT NULL,
  `ip` varchar(16) NOT NULL,
  `data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_tags`
--

CREATE TABLE `ch_tags` (
  `name` varchar(32) NOT NULL default '',
  `image_id` mediumint(8) unsigned default NULL,
  `pubdate` date NOT NULL default '0000-00-00',
  `description` text NOT NULL,
  `img` varchar(255) NOT NULL default '',
  PRIMARY KEY  (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_usergroup`
--

CREATE TABLE `ch_usergroup` (
  `group_id` int(4) NOT NULL auto_increment COMMENT '用户组ID',
  `group_name` varchar(32) NOT NULL COMMENT '用户组名称',
  `rights` text COMMENT '权限集合',
  PRIMARY KEY  (`group_id`,`group_name`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_users`
--

CREATE TABLE `ch_users` (
  `uid` int(12) unsigned NOT NULL auto_increment COMMENT '用户ID',
  `name` varchar(64) default NULL COMMENT '用户名',
  `pwd` varchar(32) default NULL COMMENT '密码',
  `email` varchar(128) NOT NULL default '' COMMENT 'E-MAIL',
  `authority_type` int(4) NOT NULL default '0' COMMENT '用户权限类型',
  `pwd_question` varchar(255) default NULL COMMENT '取回密码问题',
  `pwd_answer` varchar(255) default NULL COMMENT '答案',
  `join_time` timestamp NOT NULL default CURRENT_TIMESTAMP COMMENT '注册时间',
  `join_ip` varchar(20) default NULL COMMENT '昵称',
  `islocked` tinyint(2) NOT NULL default '1' COMMENT '用户是否被锁定',
  `lastlogin_time` int(11) default NULL COMMENT '上次登陆时间',
  `lastlogin_ip` varchar(20) default NULL COMMENT '上次登陆ip地址',
  `gender` tinyint(2) NOT NULL default '1',
  `bothday` date NOT NULL default '0000-00-00',
  `description` varchar(128) NOT NULL,
  PRIMARY KEY  (`uid`,`email`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_users_albums`
--

CREATE TABLE `ch_users_albums` (
  `id` int(10) NOT NULL auto_increment,
  `classname` varchar(32) NOT NULL,
  `name` varchar(128) NOT NULL,
  `uid` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `cover` varchar(128) NOT NULL,
  `create_time` timestamp NOT NULL default CURRENT_TIMESTAMP,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_users_forgetpwd`
--

CREATE TABLE `ch_users_forgetpwd` (
  `authkey` varchar(64) NOT NULL,
  `email` varchar(128) NOT NULL,
  `name` varchar(64) NOT NULL,
  `createtime` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  PRIMARY KEY  USING BTREE (`authkey`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='用于密码找回';

-- --------------------------------------------------------

--
-- 表的结构 `ch_users_images`
--

CREATE TABLE `ch_users_images` (
  `id` int(12) unsigned NOT NULL auto_increment,
  `from_id` int(11) NOT NULL default '0' COMMENT '挖自id',
  `res_id` int(10) unsigned NOT NULL,
  `album_id` int(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `create_date` timestamp NOT NULL default CURRENT_TIMESTAMP,
  `from_host` varchar(128) NOT NULL,
  `from_url` varchar(2048) NOT NULL,
  `agent` varchar(32) NOT NULL default 'chrome' COMMENT '整数则来自本站，字符串则表示来源插件类型',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_users_openapi`
--

CREATE TABLE `ch_users_openapi` (
  `uid` int(12) NOT NULL,
  `open_id` varchar(128) NOT NULL,
  PRIMARY KEY  (`open_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `ch_user_info`
--

CREATE TABLE `ch_user_info` (
  `uid` int(10) unsigned NOT NULL,
  `number_res` int(10) unsigned NOT NULL,
  `albums` int(10) unsigned NOT NULL,
  `fans` varchar(45) NOT NULL,
  PRIMARY KEY  (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
