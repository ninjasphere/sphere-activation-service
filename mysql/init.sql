CREATE USER 'ninja'@'%' IDENTIFIED BY 'ninja';
CREATE USER 'douitsu'@'%' IDENTIFIED BY 'douitsu';
CREATE DATABASE ninja;
CREATE DATABASE douitsu;
GRANT ALL PRIVILEGES ON ninja.* TO 'ninja'@'%' IDENTIFIED BY 'ninja';
GRANT ALL PRIVILEGES ON douitsu.* TO 'douitsu'@'%' IDENTIFIED BY 'douitsu';
