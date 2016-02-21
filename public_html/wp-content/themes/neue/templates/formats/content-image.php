<div class="post image">
	<span class="date"><?php echo get_the_date( 'd' ); ?><br><small><?php echo get_the_date( 'M' ); ?></small></span>
	<div class="post-media">
        <?php get_image( array('width' => 900, 'responsive' => true )); ?>		
	</div>
	<div class="post-title">
		<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
		<div class="post-meta">
			<h6><?php _e( 'Posted by' , 'spyropress' )?> <a href="<?php echo get_author_posts_url( get_the_author_meta( 'ID' ) ); ?>"><?php the_auther(); ?></a> / <a href="<?php echo get_post_format_link( get_post_format() );?>"><?php echo get_post_format(); ?></h6>							
		</div>
	</div>				
		
	<div class="post-body">
		<?php echo spyropress_get_excerpt( array( 'length' => 50, ) );?>         
	</div>
</div>

