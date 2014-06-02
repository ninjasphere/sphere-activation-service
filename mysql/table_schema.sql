CREATE TABLE IF NOT EXISTS `nodes` (
  `mqtt_client_id` int(20) NOT NULL AUTO_INCREMENT UNIQUE,
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `node_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `site_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `token` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `node_id`),
  UNIQUE KEY `token_UNIQUE` (`token`)
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
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- alter table nodes add column mqtt_client_id int(20) not null auto_increment unique first;
