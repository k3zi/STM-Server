<?php

/**
 * Default Page Template
 */

get_header();

spyropress_before_main_container();

    spyropress_before_loop();
    while( have_posts() ) {
        the_post();

        spyropress_before_post();

            get_template_part( 'page', 'content' );

        spyropress_after_post();
    }
    spyropress_after_loop();

spyropress_after_main_container();

get_footer(); ?>