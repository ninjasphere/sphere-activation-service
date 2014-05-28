Activation Service
=============

This service manages nodes and their tokens, and is the companion of mqtt-proxy.

Provides an internal RPC for activating nodes and their tokens.

Tables assumed to be:

```sql
  CREATE TABLE nodes (
    `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `node_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `site_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `token` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `node_id`),
    UNIQUE KEY `token_UNIQUE` (`token`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

  CREATE TABLE `users` (
    `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `name` varchar(128) NOT NULL,
    `email` varchar(128) NOT NULL,
    `lastAccessToken` varchar(128) NOT NULL,
    `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

  CREATE TABLE `sites` (
    `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `site_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `site_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```
