<?php

/**
 * Theme Meta Info for internal usage
 *
 * Dont Mess with it.
 */
add_action( 'before_spyropress_core_includes', 'spyropress_setup_theme' );
function spyropress_setup_theme() {
    global $spyropress;

    $spyropress->internal_name = 'neue';
    $spyropress->theme_name = 'Neue';
    $spyropress->theme_version = '1.0';
    $spyropress->themekey = 'fj9nzqmyzqne9ouib0e0ivt9qgarra3nm';

    $spyropress->framework = 'skt';
    $spyropress->grid_columns = 16;
    $spyropress->row_class = 'container';
}
?>