<?php
require_once('../includes/includes.php');

$streamAlphaID = $_GET['streamID'];
$id = $hashids->decode($streamAlphaID);
$stream = streamInfoForID($streamID);
print_r($stream);

if((int)$stream['private'] == 1 && strlen($stream['passcode']) > 0){
	if(isset($_POST['passcode'])){
		$entered_pass = "";
		foreach($_POST['passcode'] as $num){
			if(ctype_digit($num))
				$entered_pass .= $num;
		}

		if((string)$entered_pass != (string)$stream['passcode']){
			header("Location: http://stm.io/p/".$_GET['streamID']);
		}
	}else{
		header("Location: http://stm.io/p/".$_GET['streamID']);
	}
}

if(!isset($stream['name']))
    $error = "This stream doesn't exist or was deleted";
if(!$error){
    $user = infoForUserID($stream['id']);
    if(!isset($user['username']))
        $error = "The owner of this stream has removed their account";
}

$isOnline = (time() - (int)$stream['last_packet']) > 15;
$name = $stream['name'];
$username = $user['username'];
$userDir = '../api/uploads_ddecebdea58b5f264d27f1f7909bab74/_'.$user['username'].'_'.md5($user['username']).'/';

$userFile = $userDir.$streamID.'.info';
if(is_file($userFile))
    $streamDetails = json_decode(file_get_contents($userFile));

if(strlen($stream["songName"]) == 0)$stream["songName"] = "No Song Playing";

//Load Comments
$comments = getNewComments($streamID, 0);
$fetchTime = time();

$stuffedRequest = iEncrypt(json_encode(array('streamID' => $streamID, 'time' => time(), 'IPAddress' => $_SERVER['REMOTE_ADDR'], 'userAgent' => $_SERVER['HTTP_USER_AGENT'])));
$stuffedRequest = urlencode($stuffedRequest);
?>

<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US" prefix="og: http://ogp.me/ns#"><!--<![endif]--><head>
    <meta name="apple-itunes-app" content="app-id=933037647">

    <meta property="twitter:account_id" content="4503599627426989">
    <title>STM | <?=$name?></title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?=$name?> by <?=$username?>">
    <script type="text/javascript" src="/js/jquery.js"></script>
	<script type="text/javascript" src="/js/jquery.jplayer.min.js"></script>
    <? if(!$error): ?>
    <script type="text/javascript">
		fetchTime = <?=$fetchTime?>;

        jQuery(document).ready(function(){
			jQuery("#comments").animate({scrollTop: jQuery("#comments").height()}, 1000);
			setInterval(function(){
				$.ajax({
      				type: "POST",
					dataType: "json",
					url: "https://api.stm.io/fetch/<?=$stuffedRequest?>",
					data: {"fetchTime": fetchTime},
					success: function(data) {
						fetchTime = data.time;

						if((!data.stream || data.stream.songName.length == 0) && jQuery('#jquery_jplayer_1').data().jPlayer.status.paused){
							jQuery("#txtSongName").text("Stream Offline");
							jQuery("#txtSongArtist").text("");
						}else if(jQuery("#txtSongName").text() != data.stream.songName && data.stream.songName && data.stream.songName.length != 0){
							jQuery("#txtSongName").text(data.stream.songName);
							jQuery("#txtSongArtist").text(data.stream.songArtist);
							jQuery("#songArtwork").attr("src", "http://api.stm.io/artwork/<?=$username?>/<?=$_GET['streamID']?>?a=" + Math.floor((Math.random() * 1000000) + 1));
						}else if(jQuery("#txtSongName").text() != data.stream.songName){
							jQuery("#txtSongName").text("No Song Playing	");
							jQuery("#txtSongArtist").text("");
						}

						if(data.comments && data.comments.length > 0){
							var list = jQuery("#comments").append('<ul class="comment_set"></ul>').children().last();
							jQuery.each(data.comments, function(i, val){
								list.append("<li><div class='author'><img height='20px' width='20px' src='https://api.stm.io/getProfilePic/" + val.user.username + "'>" + val.user.name + "</div><div class='message'>" + val.message + "</div><div style='clear:both;'></div></li>");
								jQuery("#comments").animate({scrollTop: jQuery("#comments").height()}, 1000);
							});
						}
      				}
    			});
			}, 10000);

            var redirect = function (location) {
                jQuery('body').append(jQuery('<iframe></iframe>').attr('src', location).css({
                    width: 1,
                    height: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0
                }));
            };


          jQuery("#jquery_jplayer_1").jPlayer({
            ready: function() {
              jQuery(this).jPlayer("setMedia", {
                m4a: "https://api.stm.io/live/<?=$stuffedRequest?>"
              }).jPlayer("play");
              var click = document.ontouchstart === undefined ? 'click' : 'touchstart';
              var kickoff = function () {
                jQuery("#jquery_jplayer_1").jPlayer("play");
                document.documentElement.removeEventListener(click, kickoff, true);
              };
              document.documentElement.addEventListener(click, kickoff, true);
            },
			error: function (event){
        		if(event.jPlayer.error.type == "e_url"){
					jQuery("#txtSongName").text("Stream Offline");
					jQuery("#txtSongArtist").text("");

					setTimeout(function(){
						jQuery("#jquery_jplayer_1").jPlayer("setMedia", {
							m4a: "https://api.stm.io/live/<?=$stuffedRequest?>"
						}).jPlayer("play");
					}, 5000);
				}
    		},
            loop: true,
			repeat: function(event) {
			  	if(event.jPlayer.options.loop) {
					jQuery(this).unbind(".jPlayerRepeat").bind(jQuery.jPlayer.event.ended + ".jPlayer.jPlayerRepeat", function() {
				  		jQuery(this).jPlayer("setMedia", {
							m4a: "https://api.stm.io/live/<?=$stuffedRequest?>"
						}).jPlayer("play");
					});
			  	} else {
					jQuery(this).unbind(".jPlayerRepeat");
			  	}
			},
            swfPath: "/js",
            supplied: "m4a"
          });

            redirect('streamtome://stream?id=<?=$_GET['streamID']?>');
        });
    </script>
	<? endif; ?>

    <link rel="stylesheet" href="/assets/style.css">
    <link rel="shortcut icon" href="/wp-content/uploads/2014/11/Untitled-1.png">
</head>
<body>
    <div id="headerHolder">
        <div id="header">
            <a href="http://stm.io/" title="Stream To Me">
               <img class="logo" src="https://stm.io/logo.png" alt="Stream To Me" title="Stream To Me">
            </a>
        </div>

        <? if($username): ?>
        <div id="streamInfo">
            <img id="streamAuthorImage" src="https://api.stm.io/getProfilePic/<?=$username?>">
            <div style="display: inline-block;vertical-align: top;line-height: 18px;text-align: left;padding-top: 7px;padding-bottom: 7px;">
                <strong style="color: #fff;"><?=$name?></strong>
                <br>
                <span style="color: #ccc;">@<?=$username?></span>
            </div>
         </div>
         <? endif; ?>
    </div>

	 <? if(!$error): ?>
         <div id="comments" class="content">
            <ul class="comment_set">
                <? foreach($comments as $comment){
					$comment = $comment->getOData();
				?>
                <li>
                    <div class="author"><img height="20px" width="20px" src="https://api.stm.io/getProfilePic/<?=$comment['user_username']?>"><?=$comment['user_name']?></div>
                    <div class="message"><?=$comment['message']?></div>
                    <div style="clear:both;"></div>
                </li>
                <? } ?>
         </div>
     <? else: ?>
     	<div class="fullContent">
     		<p class="divStyle1"><strong><?=$error?></strong></p>
        </div>
     <? endif; ?>

     <? if(!$error): ?>
     <div id="footer">
        <div class="shadowBackground">
            <div class="colorBackground">
                <div id="jquery_jplayer_1"></div>
                <div class="i_container" style="height: 50px; display: inline-block;">
                    <img id="songArtwork" class="inbl" src="https://api.stm.io/artwork/<?=$username?>/<?=$_GET['streamID']?>" alt="<?=$stream["songAlbum"]?>"/>
                    <div class="inbl" style="margin-left: 2px; width: calc(100% - 50px);">
                        <span style="display: inline-block; vertical-align: middle; height: 50px;"></span>
                        <span style="display: inline-block; vertical-align: middle; width: 100%;">
                            <strong id="txtSongName"><?=$stream["songName"]?></strong>
                            <t id="txtSongArtist" style="color: #eee;"><?=$stream["songArtist"]?></t>
                        </span>
                    </div>
                </div>

                <span style="float:right" id="jp_container_1">
                    <a href="#" class="jp-play" style="float: right;"><img src="/assets/play.png" height="50px" /></a>
                    <a href="#" class="jp-pause" style="float: right;"><img src="/assets/pause.png" height="50px" /></a>
                </span>
      		</div>
      	</div>
      </div>
	<? endif; ?>
	<script>
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

      ga('create', 'UA-56458019-1', 'auto');
      ga('send', 'pageview');

    </script>
</body>
</html>
