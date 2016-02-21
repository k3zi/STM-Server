<?php
require('vendor/autoload.php');
$db = new Everyman\Neo4j\Client('69.4.80.29', 7474);
$db->getTransport()
  ->setAuth('neo4j', 'gbmpYiJq9f0KOQSjAj');
$hashids = new Hashids\Hashids("pepper", 4, "abcdefghijkmnpqrstuvwxy23456789");

function DB(){
	global $db;
	return $db;
}

function query($q) {
  $query = new Everyman\Neo4j\Cypher\Query(DB(), $q);
  return $query->getResultSet();
}

function streamInfoForID($streamID){
	return DB()->getNode($streamID);
}

function infoForUserID($streamID){
  return query("START x = node({$streamID}) MATCH x <-[:createdStream]-(user) RETURN user")[0];
}

function decodeHash($alpha){
  global $hashids;
  return $hashids->decode($alpha)[0];
}

function getNewComments($streamID, $lastFetch = 0, $userID = null){
  return array();
	if($lastFetch > 0){
		$includeUser = $userID ? "in('CommentLikeConnect')[@rid = ".$userID."] as didLike, in('CommentRepostConnect')[@rid = ".$userID."] as didRepost," : '';
		$results = DB()->query("select *,".$includeUser." in('CommentLikeConnect').size() as hearts, in('CommentRepostConnect').size() as reposts, user.* as user_ from STMComment WHERE stream.@rid = ".$streamID." and date > ".$lastFetch." ORDER BY date DESC fetchplan in_*:-2 out_*:-2");

		$results = array_reverse($results);
	}else{
		$includeUser = $userID ? "in('CommentLikeConnect')[@rid = ".$userID."] as didLike, in('CommentRepostConnect')[@rid = ".$userID."] as didRepost," : '';
		$results = DB()->query("select *,".$includeUser." in('CommentLikeConnect').size() as hearts, in('CommentRepostConnect').size() as reposts, user.* as user_ from STMComment WHERE stream.@rid = ".$streamID." ORDER BY date DESC LIMIT 25 fetchplan in_*:-2 out_*:-2");

		$results = array_reverse($results);
	}

	return $results;
}

function userDir(){
	$str = '/home/stream/api/uploads_ddecebdea58b5f264d27f1f7909bab74/_'.$_SESSION['username'].'_'.md5($_SESSION['username']).'/';
	if (!is_dir($str)) {
		mkdir($str);
	}
	return $str;
}

function userPicsDir($username){
	$str = '/home/stream/api/pics_acd9f82099bcae0b0333bee07cac6715/_'.$username.'_'.md5($username).'/';
	if (!is_dir($str)) {
		mkdir($str);
	}
	return $str;
}

function iEncrypt($data) {
	$encryptionMethod = "AES-256-CBC";
	$secret = "JNeKZrihw7WuMx8E5Ou9aiRh2PGDZXAI";
	$iv = substr($secret, 0, 16);

	return openssl_encrypt($data, $encryptionMethod, $secret,0,$iv);
}

function iDecrypt($data) {
	$encryptionMethod = "AES-256-CBC";
	$secret = "JNeKZrihw7WuMx8E5Ou9aiRh2PGDZXAI";
	$iv = substr($secret, 0, 16);

	return openssl_decrypt($data, $encryptionMethod, $secret,0,$iv);
}
