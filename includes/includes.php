<?php
require('vendor/autoload.php');
$db = new Everyman\Neo4j\Client('localhost', 7474);
$hashids = new Hashids\Hashids('coledrakeweezykanyejayz');

function DB(){
	global $db;
	return $db;
}

function streamInfoForID($streamID){
	$results = DB()->query("SELECT *, out('TagConnect')[string] as tags FROM STMStream WHERE @rid = ".$streamID." LIMIT 1");
	return $results[0]->getOData();
}

function infoForUserID($userID){
	$results = DB()->query("SELECT * FROM STMUser WHERE @rid = ".$userID." LIMIT 1");
	return $results[0]->getOData();
}

function getNewComments($streamID, $lastFetch = 0, $userID = null){
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
