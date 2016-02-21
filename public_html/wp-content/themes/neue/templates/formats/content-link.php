<?php
$link = get_post_meta( get_the_ID(), '_format_link_url', true );
$searches = array( 'http://', 'https://' );
?>
<div class="post link">
	<span class="date"><?php echo get_the_date( 'd' ); ?><br><small><?php echo get_the_date( 'M' ); ?></small></span>
	<div class="post-title">
		<h3><?php the_content(); ?></h3>
		<div class="post-meta">
			<h6><a href="<?php echo $link; ?>" rel="nofollow" target="_blank"><?php echo str_replace( $searches, '', $link ); ?></a></h6>							
		</div>
	</div>				
</div>