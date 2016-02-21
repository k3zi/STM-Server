<div class="post image">
	<span class="date"><?php echo get_the_date( 'd' ); ?><br><small><?php echo get_the_date( 'M' ); ?></small></span>
	<div class="post-media">
    <?php
    $attachments = get_children( array(
        'post_parent'       => get_the_ID(),
        'post_status'       => 'inherit',
        'post_type'         => 'attachment',
        'post_mime_type'    => 'image',
        'orderby'           => 'date',
        'order'             => 'ASC'
    ) );
    
    if ( !empty( $attachments ) ) {
    ?>
        <ul class="gallery-blog clearfix">
        <?php
        foreach( $attachments as $attachment ) {
            $image_url = get_image( array(
                'attachment' => $attachment->ID,
                'width' => 900,
                'before' => '<li>',
                'after' => '</li>'
            ));
        }       
        ?>
		</ul>
        <div class="gallery-blog-next"></div>
		<div class="gallery-blog-prev"></div>
    <?php } ?>		
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
