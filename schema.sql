CREATE DATABASE cs411;
USE cs411;

CREATE TABLE users
(user_id INT AUTO_INCREMENT,
first_name CHAR(20),
last_name CHAR(20),
email CHAR(30),
hometown CHAR(10),
date_of_birth DATE,
gender CHAR(1),
password CHAR(20) NOT NULL,
PRIMARY KEY (user_id));
