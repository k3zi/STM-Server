<div class="post image">
	<span class="date"><?php echo get_the_date( 'd' ); ?><br><small><?php echo get_the_date( 'M' ); ?></small></span>
	<div class="post-media">
        <?php get_image( array('width' => 900, 'responsive' => true )); ?>
	</div>
	<div class="post-title">
		<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
		<div class="post-meta">
			<h6><?php _e( 'Posted by' , 'spyropress' )?> <a href="<?php echo get_author_posts_url( get_the_author_meta( 'ID' ) ); ?>"><?php the_author(); ?></a><?php the_terms( get_the_ID(), 'category', ' / ' ); ?></h6>
		</div>
	</div>
	<div class="post-body">
	<?php
        if( is_single() ) {
            the_content();
        }
        else {
            the_excerpt();
        }
    ?>
	</div>
</div>