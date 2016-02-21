<?php

/**
 * SpyroPress is a theme framework for professional WordPress theme designing developed by SpyroSol.
 *
 * DON'T HACK ME!! You should NOT modify the SpyroPress theme framework to avoid issues with updates in the future.
 * It's designed to offer cutting edge flexibility - with lots of ways to manipulate output!
 *
 * @package SpyroPress
 */

/**
 * Set Max Content Width
 */
if ( ! isset( $content_width ) )
    $content_width = 726;

if( !function_exists( 'spyropress_content_width' ) ) {
    function spyropress_content_width() {
        if( is_page_template( 'template-full-width.php' ) || is_attachment() ) {
            global $content_width;
            $content_width = 960;
        }
    }
}
add_action( 'template_redirect', 'spyropress_content_width' );

/**
 * Starting SpyroPress Engine
 */
load_template( get_template_directory() . '/framework/spyropress.php', true );
load_template( get_template_directory() . '/includes/init.php', true ); // Extending theme

/**
 * Add theme support for spyropress framework features
 */
add_action( 'after_setup_theme', 'my_theme_setup', 4 );
function my_theme_setup() {

    // Add wordpress features
    add_theme_support( 'automatic-feed-links' );

    // Add post thumbnails (http://codex.wordpress.org/Post_Thumbnails)
    add_theme_support( 'post-thumbnails' );
    
    // Tell the TinyMCE editor to use a custom stylesheet
    add_editor_style( assets_css() . 'editor-style.css' );
    
    // Root Relative Urls Support
    add_theme_support( 'relative-urls' );

    // SpyroPress Builder
    add_theme_support( 'spyropress-builder' );
	
	// Custom CSS Editor
    add_theme_support( 'spyropress-ace' );

    // Add post formats (http://codex.wordpress.org/Post_Formats)
    add_theme_support( 'post-formats', array(
        'gallery',
        'link',
        'image',
        'quote',
        'video'        
    ) );

    // Add Components
    add_theme_support( 'spyropress-components', array(
        'bucket',
        'bootstrap-nav',
        'pagination'
    ) );

    // Add Menus
    add_theme_support( 'spyropress-core-menus', array(
        'primary' => 'Main'
    ) );

    // Add Sidebars
    $sidebars = array(
        'primary' => array(
            'name' => __( 'Primary', 'spyropress' ),
            'description' => __( 'The main (primary) widget area, most often used as a sidebar.','spyropress' ),
            'before_widget' => '<div id="%1$s" class="widget %2$s">',
            'after_widget' => '</div>',
            'before_title' => '<h4>',
            'after_title' => '</h4>'
        ),
    );
    add_theme_support( 'spyropress-core-sidebars', $sidebars );

    // Options
    $options = array(
        'theme' => array(
            'page_title' => __( 'Theme Options', 'spyropress' ),
            'menu_title' => __( 'Theme Options', 'spyropress' ),
            'isactive' => true,
            'hidden' => false
        )
    );
    add_theme_support( 'spyropress-options', $options );
}

?>