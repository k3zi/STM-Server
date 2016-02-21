<?
require_once('../includes/includes.php');
$streamID = alphaID($_GET['streamID'], true);
$stream = streamInfoForID($streamID);
if(!isset($stream['name']))
    $error = "This stream doesn't exist or was deleted";
if(!$error){
    $user = infoForUserID($stream['owner']);
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
?>

<html xmlns="http://www.w3.org/1999/xhtml" lang="en-US" prefix="og: http://ogp.me/ns#"><!--<![endif]--><head>
    <meta name="apple-itunes-app" content="app-id=933037647">
    
    <meta property="twitter:account_id" content="4503599627426989">
    <title>STM | Enter Passcode</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?=$name?> by <?=$username?>">
    <script type="text/javascript" src="/js/jquery.js"></script>
	<script type="text/javascript" src="/js/jquery.jplayer.min.js"></script>
    <? if(!$error): ?>
    <script type="text/javascript">
        jQuery(document).ready(function(){
            var redirect = function (location) {
                jQuery('body').append(jQuery('<iframe></iframe>').attr('src', location).css({
                    width: 1,
                    height: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0
                }));
            };
            
			
			
			jQuery("input").keyup(function() {
				if(jQuery(this).val().length >= 1) {
				  var input_flds = jQuery(this).closest('form').find(':input');
				  input_flds.eq(input_flds.index(this) + 1).focus();
				}
			});
			
			jQuery('#passForm :input:enabled:visible:first').focus();
            
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
               <img class="logo" src="http://stm.io/logo.png" alt="Stream To Me" title="Stream To Me">
            </a>
        </div>    
        
        <? if($username): ?>
        <div id="streamInfo">
            <img id="streamAuthorImage" src="https://api.stm.io/getSmallProfilePic.php?username=<?=$username?>">
            <div style="display: inline-block;vertical-align: top;line-height: 18px;text-align: left;padding-top: 7px;padding-bottom: 7px;">
                <strong style="color: #fff;"><?=$name?></strong>
                <br>
                <span style="color: #ccc;">@<?=$username?></span>
            </div>                   
         </div>
         <? endif; ?>
    </div>
     
	 <? if(!$error): ?> 
     	<div class="fullContent">
     		<div class="divStyle1" style="padding: 9px;">
            	<p style="margin: 0; margin-bottom: 9px;">Passcode:</p>
                 <form id="passForm" action="http://stm.io/s/<?=$_GET['streamID']?>" method="post">
                    <? for($i = 0; $i < strlen($stream['passcode']); $i++): ?>
                        <input type="password" maxlength="1" name="passcode[<?=$i?>]" />
                    <? endfor;?>
                    <br>
                    <input class="but1" type="submit" value="Continue">
                </form>
        	</div>
        </div>
     <? else: ?>
     	<div class="fullContent">
     		<p class="divStyle1"><strong><?=$error?></strong></p>
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