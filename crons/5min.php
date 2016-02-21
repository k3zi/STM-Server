<?php
require_once('../api/api_8a5da52ed126447d359e70c05721a8aa/db.php');

//Fix Offline Streams
//$mysqli->query("UPDATE `streams` SET `streams`.`songName` = '', `streams`.`songAlbum` = '', `streams`.`songArtist` = '' WHERE `streams`.`last_packet` < ".(time() - 60));