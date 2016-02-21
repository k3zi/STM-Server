<?php

/**
 * Enqueue scripts and stylesheets
 *
 * @category Core
 * @package SpyroPress
 *
 */

/**
 * Register StyleSheets
 */
function spyropress_register_stylesheets() {

    
    $gurl = 'http' . ( is_ssl() ? 's' : '' ) . '://fonts.googleapis.com/css?family=Roboto:400,300,100';
    
    //Default Css File
    wp_enqueue_style( 'google-fonts', $gurl );
    wp_enqueue_style( 'reset', assets_css() . 'reset.css', false, false );
    wp_enqueue_style( 'skeleton', assets_css() . 'skeleton.css', false, false );
    wp_enqueue_style( 'style', assets_css() . 'style.css', false, false );
    
    $them_layout = get_setting( 'theme-skin' );
    if( $them_layout == 'android' )
        wp_enqueue_style( 'style-and', assets_css() . 'style-and.css', false, false );

    
    wp_enqueue_style( 'custom', child_url() . 'assets/css/custom.css', false, false );
    
    // Dynamic StyleSheet
    if ( file_exists( dynamic_css_path() . 'dynamic.css' ) )
        wp_enqueue_style( 'dynamic', dynamic_css_url() . 'dynamic.css', false, false );

    // Builder StyleSheet
    if ( file_exists( dynamic_css_path() . 'builder.css' ) )
        wp_enqueue_style( 'builder', dynamic_css_url() . 'builder.css', false, false );

    // modernizr
    wp_enqueue_script( 'jquery' );
    wp_enqueue_script( 'prototype' );
    wp_enqueue_script( 'scriptaculous' );
}

/**
 * Enqueque Scripts
 */
function spyropress_register_scripts() {

    /**
     * Register Scripts
     */
    // threaded comments
    if ( is_single() && comments_open() && get_option( 'thread_comments' ) )
        wp_enqueue_script( 'comment-reply' );

    // Librery
    //wp_register_script( 'prototype', assets_js() . 'libs/prototype.js', false, false, true );
    //wp_register_script( 'scriptaculous', assets_js() . 'libs/scriptaculous.js', false, false, true );
    wp_register_script( 'sizzle', assets_js() . 'libs/sizzle.js', false, false, true );
    wp_register_script( 'jquery-smoothscroll', assets_js() . 'smoothscroll.js', false, false, true );
    wp_register_script( 'jquery-easing', assets_js() . 'jquery.easing.js', false, false, true );
    wp_register_script( 'jquery-scrollto', assets_js() . 'jquery.scrollto.min.js', false, false, true );
    wp_register_script( 'jquery-localscroll', assets_js() . 'jquery.localscroll.min.js', false, false, true );
    wp_register_script( 'jquery-bxslider', assets_js() . 'jquery.bxslider.min.js', false, false, true );
    wp_register_script( 'jquery-waypoints', assets_js() . 'waypoints.min.js', false, false, true );
    wp_register_script( 'jquery-loupe', assets_js() . 'loupe.js', false, false, true );
    wp_register_script( 'jquery-notifications', assets_js() . 'notifications.js', false, false, true );
    wp_register_script( 'jquery-fitvids', assets_js() . 'jquery.fitvids.js', false, false, true );
    wp_register_script( 'jquery-appear', assets_js() . 'jquery.appear.js', false, false, true );
    
    $deps = array(
        //'prototype',
        //'scriptaculous',
        'sizzle',
        'jquery-smoothscroll',
        'jquery-easing',
        'jquery-scrollto',
        'jquery-localscroll',
        'jquery-bxslider',
        'jquery-waypoints',
        'jquery-notifications',
        'jquery-fitvids',
        'jquery-appear',
        
    );
    if( is_front_page() )
      $deps[] =  'jquery-loupe';
    
    // custom scripts
    wp_register_script( 'custom-script', assets_js() . 'init.js', $deps, false, true );
   
    /**
     * Enqueue All
     */
    wp_enqueue_script( 'custom-script' );
    $theme_settings = array( 
        'assets' => assets()
    );
    wp_localize_script( 'jquery-loupe', 'theme_settings', $theme_settings );
}

function spyropress_conditional_scripts() {

    $content = '<!--[if lt IE 9]>
		<script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
	<![endif]--><!--[if lt IE 9]>
		<link rel="stylesheet" type="text/css" href="'. assets_css() .'ie.css" />
	<![endif]-->';

    echo get_relative_url( $content );
}