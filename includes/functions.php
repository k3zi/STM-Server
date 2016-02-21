<?php
use PhpOrient\PhpOrient;
$db = new PhpOrient();
$db->configure( array(
    'username' => 'root',
    'password' => '603D68FE88D10385298EAF122A86E110B5E9B8219947E21B8764C3E1960728BD',
    'hostname' => 'localhost',
    'port'     => 2424,
));
$db->dbOpen('stm', 'root', '603D68FE88D10385298EAF122A86E110B5E9B8219947E21B8764C3E1960728BD');
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

/*
function login($username = "", $password = "", $isHashed = FALSE){
	if(strlen($username) == 0 || strlen($password) == 0){
		return false;	
	}else{
		if(!$isHashed)
			$password = hashPass($password);
			
		return DB::queryFirstRow("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name FROM users WHERE username = %s AND password = %s LIMIT 1", $username, $password);
	}
}

function signup($username = "", $name = "", $password = "", $email = ""){
	if(strlen($username) == 0 || strlen($password) == 0 || strlen($email) == 0 || strlen($name) == 0){
		return false;	
	}else{
		$password = hashPass($password);
		
		if(DB::queryFirstRow("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name FROM users WHERE username = %s LIMIT 1", $username))
			return array('method' => 'signup', 'status' => 'err', 'error' => 'Username exists');
			
		if(DB::queryFirstRow("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name FROM users WHERE email = %s LIMIT 1", $email))
			return array('method' => 'signup', 'status' => 'err', 'error' => 'Email exists');
		
		if(DB::insert('users', array('username' => $username, 'password' => $password, 'email' => $email, 'name' => $name))){
            mailAdmin("STM | New User", "A new user signed up, '".$username."', with a display name: '".$name."' and email: '".$email."'");
           return $password;
        }else
			return array('method' => 'signup', 'status' => 'err', 'error' => 'Database error');
	}
}

function createStream($owner, $name, $passcode, $tags, &$securityHash){
	if(strlen($name) < 3 || $name == 'local')
		return array('method' => 'createStream', 'status' => 'err', 'error' => 'Name too short');

	$id = rand(1,9).$owner.time().rand(1,9);
	$securityHash = mt_rand_str(10);
	if(DB::insert('streams', array('id' => $id, 'owner' => $owner, 'name' => $name, 'private' => (strlen($passcode) > 0), 'passcode' => (int)$passcode, 'last_packet' => time(), 'tags' => $tags, 'securityHash' => $securityHash))){
		$user = infoForUserID($owner);
		addEvent($owner, 'created', $user["name"]." (@".$user["username"].") created a new stream: ".$name, $id);
        mailAdmin("STM | New Stream Created", "A new stream called '".$name."' was created by user id: '".$owner."'.\n\nStream Link: http://stm.io/s/".alphaID($id));
		return $id;
    }
	else
		return array('method' => 'signup', 'status' => 'err', 'error' => 'Database error');
}

function fetchStreamsForOwner($owner){
    $streams = array();
    $results = DB::query("SELECT *, `streams`.`name` AS stream_name, `streams`.`id` AS stream_id, `users`.`id` AS user_id, `users`.`name` AS display_name FROM `streams` INNER JOIN users ON `streams`.`owner` = `users`.`id` WHERE owner = %i", $owner);
	foreach($results as $row){
	   $row['streamAlphaID'] = alphaID($row["stream_id"]);
	   $streams[] = $row;
	} 
    return $streams;
}

function followersCount($uid){
	
    $row = DB::queryFirstRow("SELECT COUNT(*) as total FROM `follow_link` WHERE `following_uid` = %i", $uid);
    return $row ? $row["total"] : 0;
}

function followingCount($uid){
    $row = DB::queryFirstRow("SELECT COUNT(*) as total FROM `follow_link` WHERE follower_uid = %i", $uid);
    return $row ? $row["total"] : 0;
}

function isFollowingUser($follower_uid, $following_uid){
    return (bool)(DB::queryFirstRow("SELECT * FROM `follow_link` WHERE `follower_uid` = ".$follower_uid." AND `following_uid` = ".$following_uid." LIMIT 1"));
}

function followUser($follower_uid, $following_uid){
	if(isFollowingUser($follower_uid, $following_uid)){
        return array('error' => "You are already following this user");
    }
	
	$result = DB::insert('follow_link', array('follower_uid' => $follower_uid, 'following_uid' => $following_uid, 'last_read_message' => 0));
	
	$id = DB::insertId();
	$token = apnsTokenForUserID($following_uid);
	if(strlen($token) == 64){
		$user = infoForUserID($follower_uid);
		$msg = $user["name"]." (@".$user["username"].") followed you";
		sendMessageToAPNS($msg, $token);
		sendMessageToAPNS($msg, $token, TRUE);
		addNotification($following_uid, 'follower', $msg, array('follower' => $follower_uid), $follower_uid);
	}
	
	return $id;
}

function unfollowUser($follower_uid, $following_uid){
	if(DB::queryFirstRow("SELECT * FROM `follow_link` WHERE `follower_uid` = %i AND `following_uid` = %i LIMIT 1", $follower_uid, $following_uid)){
        return array('error' => "You are not following this user");
    }
	
	DB::delete('follow_link', 'follower_uid = %i AND following_uid = %i', $follower_uid, $following_uid);
}

function getFollowList($userID, $getFollowing = true, $getFollowers = true){
    
    $following = array();
    $followers = array();
    
    if($getFollowing){
        $results = DB::query("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name FROM `follow_link` INNER JOIN users ON `follow_link`.`following_uid` = `users`.`id` WHERE follower_uid = %i", $userID);
		foreach($results as $row){
			if(file_exists(userPicsDir($row["username"]).'140x140.png')){
				$row["avatar_url"] = "https://api.stm.io/getProfilePic.php?username=".$row["username"];
			}

		  $following[] = $row;
		} 
    }
    
    if($getFollowers){
        $results = DB::query("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name FROM `follow_link` INNER JOIN users ON `follow_link`.`follower_uid` = `users`.`id` WHERE following_uid = %i", $userID);
		foreach($results as $row){
			if(file_exists(userPicsDir($row["username"]).'140x140.png')){
				$row["avatar_url"] = "https://api.stm.io/getProfilePic.php?username=".$row["username"];
			}

		  $followers[] = $row;
		} 
    }
    
    return array("following" => $following, "followers" => $followers);
}

function updateAPNS($userID, $token){
	if(DB::update('users', array('token' => $token), 'id = %s', $userID))
		return array();
	else
		return array('error' => $mysqli->error);
}

function updateProfileName($userID, $name){
	if(DB::update('users', array('name' => $name), 'id = %s', $userID))
		return array();
	else
		return array('error' => $mysqli->error);
}

function updateProfileDescription($userID, $description){
	if(DB::update('users', array('description' => $description), 'id = %s', $userID))
		return array();
	else
		return array('error' => $mysqli->error);
}

//*************** Streams ****************\\

function SQL_selectStream(){
	return "`streams`.*, ".SQL_userInfo().", `streams`.`name` AS stream_name, `streams`.`id` AS stream_id";
}

function SQL_userInfo(){
	return "`users`.`description`, `users`.`verified`, `users`.`username`, `users`.`id` AS user_id, `users`.`name` AS display_name";	
}

function COUNT_streamsForUser($userID){
	$row = DB::queryFirstRow("SELECT COUNT(*) as total FROM `streams` WHERE owner = %i", $userID);
    return $row ? $row["total"] : 0;	
}

function randomStream($userID){
	return DB::queryFirstRow("SELECT ".SQL_selectStream()." FROM `streams` LEFT JOIN `users` ON `users`.`id` = `streams`.`owner` WHERE user_id != %s ORDER BY RAND() LIMIT 1", $userID);
}

function updateStreamName($userID, $streamID, $newName){
    $id = alphaID($alphaID, true);
    
	if(DB::update('streams', array('name' => $newName),  'owner = %i AND id = %i', $userID, $streamID))
		return array('method' => 'changeName', 'status' => 'ok', 'name' => $newName);
	else
		return array('method' => 'changeName', 'status' => 'error', 'error' => $mysqli->error);
}

function updateStream($userID, $songName, $songArtist, $songAlbum, $alphaID){
    $streamID = alphaID($alphaID, true);
    
	if(DB::update('streams', array('last_packet' => time(), 'songName' => $songName, 'songArtist' => $songArtist, 'songAlbum' => $songAlbum),  'owner = %i AND id = %i', $userID, $streamID))
		return streamListenersForID($streamID);
	else
		return array('error' => $mysqli->error);
}

function updateStreamTime($userID, $alphaID){
    $streamID = alphaID($alphaID, true);
    
	if(DB::update('streams', array('last_packet' => time()), 'owner = %i AND id = %i', $userID, $streamID))
		return streamListenersForID($streamID);
	else
		return array('error' => $mysqli->error);
}

function streamListenersForID($streamID){
	$row = DB::queryFirstRow("SELECT COUNT(*) as total FROM `listeners` WHERE (stream_id = %i) AND (%i - last_read) < 15  LIMIT 1", (int)$streamID, time());
	return array('listeners' => $row['total']);
}

function streamInfoForID($streamID){
	$row = DB::queryFirstRow("SELECT *, `streams`.`name` AS stream_name, `streams`.`id` AS stream_id FROM `streams` WHERE `id` = '".$streamID."' LIMIT 1");
    $row['streamAlphaID'] = alphaID($row['stream_id']);
	return $row;
}

function addComment($userID, $message, $streamID){
	DB::insert('comments', array('owner' => $userID, 'message' => $message, 'date' => time(), 'stream_id' => $streamID));
	addEvent($userID, 'comment', $message, $streamID);	
	
	return $result;
}

function getNewComments($streamID, $lastFetch, $html = false, &$outTime = null){
	$result = "";
	if((int)$lastFetch > 0){
		$results = DB::query("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name, `comments`.`id` AS comment_id FROM `comments` INNER JOIN `users` ON `users`.`id` = `comments`.`owner` WHERE `stream_id` = %i AND `date` > %i ORDER BY date ASC", $streamID, $lastFetch);
	}else{
		$results = DB::query("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name, `comments`.`id` AS comment_id FROM `comments` INNER JOIN `users` ON `users`.`id` = `comments`.`owner` WHERE `stream_id` = %i ORDER BY date ASC LIMIT 20", $streamID);
	}
	
	$rows = array();        
    foreach($results as $row){
		$row['int_date'] = $row['date'];
        $row['relative_int_time'] = time() - (int)$row['date'];
		$row['date'] = time2str($row['date']);
        
        if(file_exists(userPicsDir($row["username"]).'140x140.png')){
            $row["avatar_url"] = "https://api.stm.io/getProfilePic.php?username=".$row["username"];
        }
        
		if($html)$rows[] = '<li><div class="author"><img height="20px" width="20px" src="https://api.stm.io/getSmallProfilePic.php?username='.$row['username'].'">'.$row['name'].'</div><div class="message">'.$row['message'].'</div><div style="clear:both;"></div></li>';
		else $rows[] = $row;
		
		$outTime = $row['int_date'];
    }
	
	return $rows;
}

function addUserComment($userID, $message, $toID){
	$result = DB::insert('user_comments', array('owner' => $userID, 'message' => $message, 'date' => time(), 'to_user' => $toID));
    $token = apnsTokenForUserID($toID);
    if(strlen($token) == 64){
        $user = infoForUserID($userID);
        sendMessageToAPNS("@".$user["username"].": ".$message, $token, FALSE, 'message', (int)$user["user_id"]);
        sendMessageToAPNS("@".$user["username"].": ".$message, $token, TRUE, 'message', (int)$user["user_id"]);
    }
    
	return $result;
}

function getNewUserComents($userID, $lastFetch, $toID){
	if($lastFetch > 0){
		$results = DB::query("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name, `user_comments`.`id` AS comment_id FROM `user_comments` LEFT JOIN `users` ON `users`.`id` = `user_comments`.`owner` WHERE (`to_user` = %i OR `owner` = %i) AND (`to_user` = %i OR `owner` = %i) AND `date` > %i", $userID, $userID, $toID, $toID, $lastFetch);
	}else{
		$results = DB::query("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name, `user_comments`.`id` AS comment_id FROM `user_comments` LEFT JOIN `users` ON `users`.`id` = `user_comments`.`owner` WHERE (`to_user` = %i OR `owner` = %i) AND (`to_user` = %i OR `owner` = %i)", $userID, $userID, $toID, $toID);
	}
	
	$rows = array();        
    foreach($results as $row){
		$row['int_date'] = $row['date'];
        $row['relative_int_time'] = time() - (int)$row['date'];
		$row['date'] = time2str($row['date']);
        
        if(file_exists(userPicsDir($row["username"]).'140x140.png')){
            $row["avatar_url"] = "https://api.stm.io/getProfilePic.php?username=".$row["username"];
        }
        
        $rows[] = $row;
    }
	
	return $rows;
}

function time2str($ts){
    if(!ctype_digit($ts))
        $ts = strtotime($ts);

    $diff = time() - $ts;
    if($diff == 0)
        return 'just now';
    elseif($diff > 0){
        $day_diff = floor($diff / 86400);
        if($day_diff == 0){
            if($diff < 60) return 'just now';
            if($diff < 120) return '1 minute ago';
            if($diff < 3600) return floor($diff / 60) . ' minutes ago';
            if($diff < 7200) return '1 hour ago';
            if($diff < 86400) return floor($diff / 3600) . ' hours ago';
        }
        if($day_diff == 1) return 'Yesterday';
        if($day_diff < 7) return $day_diff . ' days ago';
        if($day_diff < 31) return ceil($day_diff / 7) . ' weeks ago';
        if($day_diff < 60) return 'last month';
        return date('F Y', $ts);
    }
    else{
        $diff = abs($diff);
        $day_diff = floor($diff / 86400);
        if($day_diff == 0){
            if($diff < 120) return 'in a minute';
            if($diff < 3600) return 'in ' . floor($diff / 60) . ' minutes';
            if($diff < 7200) return 'in an hour';
            if($diff < 86400) return 'in ' . floor($diff / 3600) . ' hours';
        }
        if($day_diff == 1) return 'Tomorrow';
        if($day_diff < 4) return date('l', $ts);
        if($day_diff < 7 + (7 - date('w'))) return 'next week';
        if(ceil($day_diff / 7) < 4) return 'in ' . ceil($day_diff / 7) . ' weeks';
        if(date('n', $ts) == date('n') + 1) return 'next month';
        return date('F Y', $ts);
    }
}

function userIDForUsername($username){
	$row = DB::queryFirstRow("SELECT id FROM users WHERE `username` = %s LIMIT 1", $username);
	return $row['id'];
}

function infoForUserID($userID){
	$row = DB::queryFirstRow("SELECT *, `users`.`id` AS user_id, `users`.`name` AS display_name FROM users WHERE `id` = %i LIMIT 1", $userID);
    if(file_exists(userPicsDir($row["username"]).'140x140.png')){
        $row["avatar_url"] = "https://api.stm.io/getProfilePic.php?username=".$row["username"];
    }
    
	return $row;
}

function apnsTokenForUserID($userID){
	$row = DB::queryFirstRow("SELECT token FROM users WHERE `id` = %i LIMIT 1", $userID);
	return $row['token'];
}

function streamIDForUserID($userID){
	$row = DB::queryFirstRow("SELECT id FROM streams WHERE `owner` = %i LIMIT 1", $userID);
	return $row['id'];
}

function incrementStreamListeners($streamID){
	DB::insertUpdate('listeners', array('client' => client(), 'stream_id' => $streamID, 'last_read' => time()));
}

function sendPulse($streamID){
    incrementStreamListeners($streamID);
}

function decrementStreamListeners($streamID){
	DB::delete('listeners', 'client = %s', client());
}

function client(){
	return $_SERVER['REMOTE_ADDR'].md5($_SERVER['REMOTE_ADDR'].$_SERVER['HTTP_USER_AGENT']);	
}

function hashPass($password){
	return sha1(md5($password).md5(strlen($password)).md5(str_rot13($password)));	
}

function addNotification($userID, $type, $message, $info = array(), $from_user = 0){
	DB::insert('notifications', array('user_id' => $userID, 'type' => $type, 'info' => json_encode($info), 'time' => time(), 'read' => 0, 'message' => $message, 'from_user' => $from_user));
}

function addEvent($userID, $type, $message, $stream_id){
	DB::insert('events', array('user_id' => $userID, 'stream_id' => $stream_id, 'message' => $message, 'type' => $type, 'time' => time()));
}

function sendMessageToAPNS($message, $token, $prod = FALSE, $type = '', $related = ''){
    $ctx = stream_context_create();
    stream_context_set_option($ctx, 'ssl', 'local_cert', $prod ? '/home/stream/STMP.pem' : '/home/stream/STM.pem');
    stream_context_set_option($ctx, 'ssl', 'passphrase', "coolguy23");

    $fp = stream_socket_client('ssl://gateway.sandbox.push.apple.com:2195', $err, $errstr, 60, STREAM_CLIENT_CONNECT|STREAM_CLIENT_PERSISTENT, $ctx);

    // Create the payload body
    $body['aps'] = array(
        'badge' => +1,
        'alert' => $message,
        'sound' => 'default'
    );
    
    if($type != ''){
        $body['aps']['type'] = $type;
    }
    
    if($related != ''){
        $body['aps']['related'] = $related;
    }

    $payload = json_encode($body);

    // Build the binary notification
    $msg = chr(0) . pack('n', 32) . pack('H*', $token) . pack('n', strlen($payload)) . $payload;

    // Send it to the server
    $result = fwrite($fp, $msg, strlen($msg));

    // Close the connection to the server
    fclose($fp);
}

function alphaID($in, $to_num = false, $pad_up = 0, $pass_key = "stmio")
{
  $out   =   '';
  $index = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  $base  = strlen($index);

  if ($pass_key !== null) {
    // Although this function's purpose is to just make the
    // ID short - and not so much secure,
    // with this patch by Simon Franz (http://blog.snaky.org/)
    // you can optionally supply a password to make it harder
    // to calculate the corresponding numeric ID

    for ($n = 0; $n < strlen($index); $n++) {
      $i[] = substr($index, $n, 1);
    }

    $pass_hash = hash('sha256',$pass_key);
    $pass_hash = (strlen($pass_hash) < strlen($index) ? hash('sha512', $pass_key) : $pass_hash);

    for ($n = 0; $n < strlen($index); $n++) {
      $p[] =  substr($pass_hash, $n, 1);
    }

    array_multisort($p, SORT_DESC, $i);
    $index = implode($i);
  }

  if ($to_num) {
    // Digital number  <<--  alphabet letter code
    $len = strlen($in) - 1;

    for ($t = $len; $t >= 0; $t--) {
      $bcp = bcpow($base, $len - $t);
      $out = $out + strpos($index, substr($in, $t, 1)) * $bcp;
    }

    if (is_numeric($pad_up)) {
      $pad_up--;

      if ($pad_up > 0) {
        $out -= pow($base, $pad_up);
      }
    }
  } else {
    // Digital number  -->>  alphabet letter code
    if (is_numeric($pad_up)) {
      $pad_up--;

      if ($pad_up > 0) {
        $in += pow($base, $pad_up);
      }
    }

    for ($t = ($in != 0 ? floor(log($in, $base)) : 0); $t >= 0; $t--) {
      $bcp = bcpow($base, $t);
      $a   = floor($in / $bcp) % $base;
      $out = $out . substr($index, $a, 1);
      $in  = $in - ($a * $bcp);
    }
  }

  return $to_num ? (int)$out : (string)$out;
}

function mt_rand_str($l, $c = 'abcdefghijklmnopqrstuvwxyz1234567890') {
    for ($s = '', $cl = strlen($c)-1, $i = 0; $i < $l; $s .= $c[mt_rand(0, $cl)], ++$i);
    return $s;
}

function mailAdmin($subject, $contents){
    $to = "admin@stm.io";
    $headers = "From: system@stm.io";

    mail($to,$subject,$contents,$headers);
}

// ************************** Search *************************\\

class Search {
        
        //Retorna um array bi-dimensional com o resultado ordenado por relevancia
        //Return a bi-dimensional array with the result sorted by relevance
		function doSearch( $val, $aList, $limit = 0, $minRel = 2, $lCase = true ) {
	    	
            $aSearch = $this->splitList( $aList, $lCase );
            $sVal	 = $this->split( $val, $lCase );
            
            $aRet = $this->scan( $sVal, $aSearch, $minRel );
            $aRet = $this->sort( $aRet );

            if( $limit > 0 ){
            	$aRet = array_slice( $aRet, 0, $limit );
            }
            
            return $aRet;
            
		}
        
        //Escanea o array recebido e retorna um novo com o numero de relevancia de cada item
        //Scan the received array and returns a new one with the number of relevance
        function scan( $val, $aList, $minRel ) {
            $aRet   = array();
            $tmp	= ceil($val[1] * 0.15);
            
            $minLen = ($val[1] - $tmp);
            $maxLen = ($val[1] + $tmp);
            $aVal   = explode( ' ', $val[0] );
            
            foreach( $aList as $item ){
            	$n = 0;

                if( $item[1] >= $minLen && $item[1] <= $maxLen){
                	foreach( $aVal as $piece ){
                    	if( strpos( $item[0], $piece ) !== false ){
                        	$n++;
                        }
	                }
                    
                    if( $val[1] == $item[1] ) $n++;
                    
                    //Só mostra os que tiverem relevancia maior ou igual ao minimo permitido
                    if( $n >= $minRel ){
                    	$aRet[] = array( $item[2], $n );
                    }
                }
            }
            
            return $aRet;
        }
        
        
        //Ordena o resultado por relevancia
        //Sort the result based on relevance
        function sort( $aList ){
        	usort($aList, 'uksort_helper');
        	return $aList;
        }
        
        
        //Divide os itens da lista em partes para serem usados na busca
        //Break the list itens in parts to use in search
        function splitList( $aList, $lCase ) {
        	
        	$list = array();
        	foreach( $aList as $item ){
            	if( ! empty( $item ) ){
					$list[] = $this->split( $item, $lCase );
                }
            }
            return $list;
        }
        
        
        //Picota uma string para ser usada na busca
        //Break a string to use in the search
        function split( $val, $lCase ) {
        	
            $base = trim($val);
            
            //Se lCase for true, faz uma busica case sensitive
            $val  = str_replace( ' ', '', ( $lCase ? $val : $this->limpa($val, true) ) );
       		
            if( mb_strlen( $val, 'UTF-8' ) > 2 ){
            	$tmp  = '';
            	$n	  = 0;
                
            	for( $c = 0; $c < ( mb_strlen( $val, 'UTF-8' ) - 1 ); $c++ ){
                   	$tmp .= mb_substr( $val, $c, 2, 'UTF-8' ) . ' ';
                    $n++;
               	}
                $ret = array(trim($tmp), mb_strlen( trim($base), 'UTF-8' ), $base );
            } else {
               	$ret = array($val, mb_strlen( trim($base), 'UTF-8' ), $base);
            }
            
            return $ret;
        }
        
        //Limpa a string e muda o case de string com caracteres especiais
        //Clean the string and change the case of the special characters
        function limpa( $text, $l = false ){
    		$text = utf8_decode( $text );
            $arr  = array( array('á','Á'),array('à','À'),array('ã','Ã'),array('â','Â'),
                           array('é','É'),array('è','È'),array('ê','Ê'),array('ç','Ç'),
                           array('í','Í'),array('ì','Ì'),array('î','Î'),array('õ','Õ'),
                           array('ô','Ô'),array('ó','Ó'),array('ò','Ò'),array('ú','Ú'),
                           array('ù','Ù'),array('û','Û'),array('ü','Ü'));
            foreach( $arr as $a ){ $text = str_replace( $a[($l ? 1 : 0)],$a[($l ? 0 : 1)], $text ); }
            if( $l ){
        		$text = utf8_encode( strtolower( $text ) );
        	} else {
        	    $text = strtoupper( $text );
        	}
            return $text;
		}
        
	}
	
	function uksort_helper( $a, $b ){
    	return ($a[1] < $b[1] ? 1 : ($a[1] > $b[1] ? -1 : 0));
    }

class SimpleImage {   
	var $image; var $image_type;   
	
	function load($file) {  
		$this->image_type = IMAGETYPE_PNG;
		$this->image = imagecreatefromstring($file); } function save($filename, $image_type=IMAGETYPE_JPEG, $compression=75, $permissions=null) {   if( $image_type == IMAGETYPE_JPEG ) { imagejpeg($this->image,$filename,$compression); } elseif( $image_type == IMAGETYPE_GIF ) {   imagegif($this->image,$filename); } elseif( $image_type == IMAGETYPE_PNG ) {   imagepng($this->image,$filename); } if( $permissions != null) {   chmod($filename,$permissions); } } function output($image_type=IMAGETYPE_JPEG) {   if( $image_type == IMAGETYPE_JPEG ) { imagejpeg($this->image); } elseif( $image_type == IMAGETYPE_GIF ) {   imagegif($this->image); } elseif( $image_type == IMAGETYPE_PNG ) {   imagepng($this->image); } } function getWidth() {   return imagesx($this->image); } function getHeight() {   return imagesy($this->image); } function resizeToHeight($height) {   $ratio = $height / $this->getHeight(); $width = $this->getWidth() * $ratio; $this->resize($width,$height); }   function resizeToWidth($width) { $ratio = $width / $this->getWidth(); $height = $this->getheight() * $ratio; $this->resize($width,$height); }   function scale($scale) { $width = $this->getWidth() * $scale/100; $height = $this->getheight() * $scale/100; $this->resize($width,$height); }   function resize($width,$height) { $new_image = imagecreatetruecolor($width, $height); imagecopyresampled($new_image, $this->image, 0, 0, 0, 0, $width, $height, $this->getWidth(), $this->getHeight()); $this->image = $new_image; }   }
		*/