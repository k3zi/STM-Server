<?php
$translate['search-title'] = get_setting( 'translate' ) ? get_setting( 'search-title', 'Search results: <span>%s</span>' ) : __( 'Search results: <span>%s</span>', 'spyropress' );
get_header(); ?>

<section class="title container">
    <div class="sixteen columns">
        <h1><?php printf( $translate['search-title'], get_search_query() ); ?></h1>
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



