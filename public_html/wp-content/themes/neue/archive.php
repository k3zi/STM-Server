<?php
get_header();
?>
<section class="title container">
    <div class="sixteen columns">
        <?php get_template_part( 'templates/archive', 'title' ) ?>
    </div>
</section>
<div id="blog" class="posts container">
    <div class="eleven columns">

<?php
while( have_posts() ) {
    the_post();
    get_template_part( 'templates/formats/content', get_post_format() ); 
}
?>
    <?php wp_pagenavi( ); ?>
    </div>
    <div class="five columns">
        <div class="sidebar">
            <?php dynamic_sidebar('primary'); ?>
        </div>
    </div>
</div>      
<?php get_footer(); ?>

