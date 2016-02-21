<div class="post image">
	<span class="date"><?php echo get_the_date( 'd' ); ?><br><small><?php echo get_the_date( 'M' ); ?></small></span>
	<div class="post-title">
		<h3><?php the_content(); ?></h3>
		<div class="post-meta">
			<h6><?php echo get_post_meta( get_the_ID(), '_format_quote_source_name', true ); ?></h6>
		</div>
	</div>
</div>