CREATE USER 'ninja'@'%' IDENTIFIED BY 'ninja';
CREATE USER 'douitsu'@'localhost' IDENTIFIED BY 'douitsu';
CREATE DATABASE ninja;
CREATE DATABASE douitsu;
GRANT ALL PRIVILEGES ON ninja. * TO 'ninja'@'%';
GRANT ALL PRIVILEGES ON douitsu. * TO 'douitsu'@'%';
