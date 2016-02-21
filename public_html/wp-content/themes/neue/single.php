<?php get_header(); ?>

<!-- Begin Title -->
<?php get_template_part( 'templates/post','top'); ?>
<!-- End Title -->

<?php spyropress_before_main_container(); ?>
<!-- Begin Posts -->
<div id="blog" class="posts container">
	<div class="eleven columns">
        <?php
            spyropress_before_loop();
            
            while( have_posts() ) {
                the_post();
                spyropress_before_post();
                    get_template_part( 'templates/formats/content', get_post_format() ); 
                spyropress_after_post();
                wp_reset_query();
                comments_template( '', true );
            }
        ?>
   </div>
   <?php
        spyropress_after_post();
   ?>
   <div class="five columns">
        <div class="sidebar">
            <?php dynamic_sidebar('primary'); ?>
        </div>
   </div>
 </div>
 
<?php spyropress_after_main_container(); ?>
<?php get_footer(); ?>