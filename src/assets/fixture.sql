-- Adminer 4.7.1 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS `cereal-box-test`;
CREATE DATABASE `cereal-box-test` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `cereal-box-test`;

DROP TABLE IF EXISTS `uncommonTypes`;
CREATE TABLE `uncommonTypes` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `json` json NULL,
  `data` tinyblob NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `author`;
CREATE TABLE `author` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `birthday` bigint(20) DEFAULT NULL,
  `active` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `author` (`id`, `name`, `birthday`, `active`) VALUES
(1,	'Co de Boswachter',	507254000,	1),
(2,	'Isaac Newton',	-10318838400,	0);

DROP TABLE IF EXISTS `book`;
CREATE TABLE `book` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `authorId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `isbn` varchar(13) NOT NULL,
  `released` int(11) NOT NULL,
  `isGood` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `authorId` (`authorId`),
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`authorId`) REFERENCES `author` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `book` (`id`, `authorId`, `title`, `subTitle`, `isbn`, `released`, `isGood`) VALUES
(1,	1,	'Being fat is a choice',	NULL,	'0123456789',	1601475287,	1),
(2,	2,	'De motu corporum in gyrum',	NULL,	'9998887776',	1601475367,	null),
(3,	2,	'Reports as Master of the Mint',	NULL,	'665554444888',	1601475367,	0);

-- 2020-09-30 14:17:18