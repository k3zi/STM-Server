<?php  $translate['blog-title'] = get_setting( 'translate' ) ? get_setting( 'blog-titles', 'Blog' ) : __( 'Blog', 'spyropress' ); ?>

<section class="title container">
    <div class="sixteen columns">
        <h1><?php echo $translate['blog-title']; ?></h1>
    </div>
</section>