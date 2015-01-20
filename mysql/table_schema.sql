CREATE TABLE IF NOT EXISTS `nodes` (
--  `mqtt_client_id` int(20) NOT NULL AUTO_INCREMENT UNIQUE,
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `node_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `site_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `hardware_type` varchar(64) NOT NULL,
--  `token` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `node_id`)
--  UNIQUE KEY `token_UNIQUE` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name` varchar(128) NOT NULL,
  `email` varchar(128) NOT NULL,
  `lastAccessToken` varchar(128) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `sites` (
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `site_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `master_node_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- alter table nodes add column mqtt_client_id int(20) not null auto_increment unique first;
-- alter table users change column `lastAccessToken` `lastAccessToken` varchar(128) NULL DEFAULT NULL;
-- alter table nodes add column `hardware_type` varchar(64) NOT NULL;
-- alter table sites add column `master_node_id` varchar(64) NOT NULL;
-- alter table users add column `sphere_network_key` varchar(64);
-- UPDATE TABLE `users` SET `sphere_network_key` = substring(MD5(RAND()), -24);
-- alter table users change column `sphere_network_key` `sphere_network_key` varchar(64) NOT NULL;
-- alter table sites change column `master_node_id` `master_node_id` varchar(64) NULL DEFAULT NULL;
