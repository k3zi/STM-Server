<?php get_header(); ?>


    <?php get_template_part( 'templates/post','top'); ?>
    
    <div id="blog" class="posts container">
        <div class="eleven columns">
        <?php
        while( have_posts() ) {
            the_post();
            
            get_template_part( 'templates/formats/content', get_post_format() );
        }
        
        wp_pagenavi( );
        ?>
    </div>
    <aside class="five columns sidebar">
        <?php dynamic_sidebar( 'primary' ); ?>
    </aside>
</div>      
<?php get_footer(); ?>