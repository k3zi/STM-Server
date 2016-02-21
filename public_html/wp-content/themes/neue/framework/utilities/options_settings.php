<?php

/**
 * Option/Settings Helper Functions
 *
 * @category Utilities
 * @package Spyropress
 *
 */

/** Option Getter and Formatter **********************/

function get_float_class( $float ) {
    
    // check for null
    if ( ! $float ) return;

    $allowed_floats = array( 'left' => 'pull-left', 'right' => 'pull-right' );

    if ( in_array( $float, array_keys( $allowed_floats ) ) )
        $float = $allowed_floats[$float];

    return $float;
}

/**
 * Row Class
 */
function get_row_class( $return = false ) {
    global $spyropress;

    if ( $return )
        return $spyropress->row_class;
    echo $spyropress->row_class;
}

/**
 * Column Class
 */
function get_column_class( $column ) {
    if( 'skt' == get_html_framework() ) return get_skeleton_col_class( $column );
    
    if( 'bs' == get_html_framework() ) return get_bootstrap_class( $column );
    
    if( 'bs3' == get_html_framework() ) return get_bootstrap3_class( $column );
    
    if( 'fd3' == get_html_framework() ) return get_foundation3_col_class( $column );
}

/**
 * Bootstrap Class
 */
function get_bootstrap_class( $column ) {

    $class = 'span12';

    switch ( $column ) {
        case 2:
            $class = 'span6';
            break;
        case 3:
            $class = 'span4';
            break;
        case 4:
            $class = 'span3';
            break;
        case 6:
            $class = 'span2';
            break;
    }

    return $class;
}

/**
 * Bootstrap Class
 */
function get_bootstrap3_class( $column ) {

    $class = 'col-md-12';

    switch ( $column ) {
        case 2:
            $class = 'col-md-6';
            break;
        case 3:
            $class = 'col-md-4';
            break;
        case 4:
            $class = 'col-md-3';
            break;
        case 6:
            $class = 'col-md-2';
            break;
    }

    return $class;
}

/**
 * Skeleton Classes
 */
function get_skeleton_col_class( $column ) {

    $class = get_skeleton_class( 16 );

    switch ( $column ) {
        case 2:
            $class = get_skeleton_class( 8 );
            break;
        case 3:
            $class = get_skeleton_class( '1/3' );
            break;
        case 4:
            $class = get_skeleton_class( 4 );
            break;
        case 8:
            $class = get_skeleton_class( 2 );
            break;
    }

    return $class;
}

function get_skeleton_class( $column ) {
    
    $classes = array(
        1 => 'one columns',
        2 => 'two columns',
        3 => 'three columns',
        4 => 'four columns',
        5 => 'five columns',
        6 => 'six columns',
        7 => 'seven columns',
        8 => 'eight columns',
        9 => 'nine columns',
        10 => 'ten columns',
        11 => 'eleven columns',
        12 => 'twelve columns',
        13 => 'thirteen columns',
        14 => 'fourteen columns',
        15 => 'fifteen columns',
        16 => 'sixteen columns',
        '1/3' => 'one-third column',
        '2/3' => 'two-thirds column',
    );
    
    return $classes[$column];
}

function get_admin_column_class( $column ) {
    
    $class = '';
    if( 12 == get_grid_columns() ) {

        $class = 'span12';
        
        switch ( $column ) {
            case 2:
                $class = 'span6';
                break;
            case 3:
                $class = 'span4';
                break;
            case 4:
                $class = 'span3';
                break;
            case 6:
                $class = 'span2';
                break;
        }
    }
    elseif( 16 == get_grid_columns() ) {

        $class = 'span16';
        
        switch ( $column ) {
            case 2:
                $class = 'span8';
                break;
            case 3:
                $class = 'span1by3';
                break;
            case 4:
                $class = 'span4';
                break;
            case 8:
                $class = 'span2';
                break;
        }
    }
    
    return $class;
}

/**
 * Foundation3 Classes
 */

function get_foundation3_col_class( $column ) {

    $class = get_foundation3_class( 12 );

    switch ( $column ) {
        case 2:
            $class = get_foundation3_class( 6 );
            break;
        case 3:
            $class = get_foundation3_class( 4 );
            break;
        case 4:
            $class = get_foundation3_class( 3 );
            break;
        case 6:
            $class = get_foundation3_class( 2 );
            break;
    }

    return $class;
}

function get_foundation3_class( $column ) {

    $classes = array(
        1 => 'one columns',
        2 => 'two columns',
        3 => 'three columns',
        4 => 'four columns',
        5 => 'five columns',
        6 => 'six columns',
        7 => 'seven columns',
        8 => 'eight columns',
        9 => 'nine columns',
        10 => 'ten columns',
        11 => 'eleven columns',
        12 => 'twelve columns'
    );
    
    return $classes[$column];
}

/**
 * Get HTML Framework
 */
function get_html_framework() {
    global $spyropress;
    return $spyropress->framework;
}

/**
 * Get Grid Column
 */
function get_grid_columns() {
    global $spyropress;
    return $spyropress->grid_columns;
}

/**
 * First Column Class accoring to framework
 */
function get_first_column_class() {
    
    // Skeleton
    if( 'skt' == get_html_framework() ) return 'alpha';
    
    // Others
    return 'column_first';
}

/**
 * Last Column Class accoring to framework
 */
function get_last_column_class() {
    
    // Skeleton
    if( 'skt' == get_html_framework() ) return 'omega';
    
    // Foundation
    if( 'fd3' == get_html_framework() ) return 'end';
    
    // Others
    return 'column_last';
}

/** Data Sources for Post Type and Taxonomies **********************/

/**
 * Buckets
 */
function spyropress_get_buckets() {
    
    $buckets = array();
    
    if ( ! post_type_exists( 'bucket' ) ) return $buckets;
    
    // get posts
    $args = array(
        'post_type' => 'bucket',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'asc'
    );
    $posts = get_posts( $args );
    if ( !empty( $posts ) ) {
        foreach ( $posts as $post ) {
            $buckets[$post->ID] = $post->post_title;
        }
    }

    return $buckets;
}

/**
 * Custom Taxonomies
 */
function spyropress_get_taxonomies( $tax = '' ) {
    
    if ( ! $tax ) return array();

    $terms = get_terms( $tax );
    $taxs = array();
    if ( !empty( $terms ) )
        foreach ( $terms as $term )
            $taxs[$term->slug] = $term->name;

    return $taxs;
}

/** Custom Data Sources ********************************************/

/**
 * jQuery Easing Options
 */
function spyropress_get_options_easing() {
    return array(
        'linear' => __( 'linear', 'spyropress' ),
        'jswing' => __( 'jswing', 'spyropress' ),
        'def' => __( 'def', 'spyropress' ),
        'easeInQuad' => __( 'easeInQuad', 'spyropress' ),
        'easeOutQuad' => __( 'easeOutQuad', 'spyropress' ),
        'easeInOutQuad' => __( 'easeInOutQuad', 'spyropress' ),
        'easeInCubic' => __( 'easeInCubic', 'spyropress' ),
        'easeOutCubic' => __( 'easeOutCubic', 'spyropress' ),
        'easeInOutCubic' => __( 'easeInOutCubic', 'spyropress' ),
        'easeInQuart' => __( 'easeInQuart', 'spyropress' ),
        'easeOutQuart' => __( 'easeOutQuart', 'spyropress' ),
        'easeInOutQuart' => __( 'easeInOutQuart', 'spyropress' ),
        'easeInQuint' => __( 'easeInQuint', 'spyropress' ),
        'easeOutQuint' => __( 'easeOutQuint', 'spyropress' ),
        'easeInOutQuint' => __( 'easeInOutQuint', 'spyropress' ),
        'easeInSine' => __( 'easeInSine', 'spyropress' ),
        'easeOutSine' => __( 'easeOutSine', 'spyropress' ),
        'easeInOutSine' => __( 'easeInOutSine', 'spyropress' ),
        'easeInExpo' => __( 'easeInExpo', 'spyropress' ),
        'easeOutExpo' => __( 'easeOutExpo', 'spyropress' ),
        'easeInOutExpo' => __( 'easeInOutExpo', 'spyropress' ),
        'easeInCirc' => __( 'easeInCirc', 'spyropress' ),
        'easeOutCirc' => __( 'easeOutCirc', 'spyropress' ),
        'easeInOutCirc' => __( 'easeInOutCirc', 'spyropress' ),
        'easeInElastic' => __( 'easeInElastic', 'spyropress' ),
        'easeOutElastic' => __( 'easeOutElastic', 'spyropress' ),
        'easeInOutElastic' => __( 'easeInOutElastic', 'spyropress' ),
        'easeInBack' => __( 'easeInBack', 'spyropress' ),
        'easeOutBack' => __( 'easeOutBack', 'spyropress' ),
        'easeInOutBack' => __( 'easeInOutBack', 'spyropress' ),
        'easeInBounce' => __( 'easeInBounce', 'spyropress' ),
        'easeOutBounce' => __( 'easeOutBounce', 'spyropress' ),
        'easeInOutBounce' => __( 'easeInOutBounce', 'spyropress' ),
    );
}

function spyropress_get_options_float() {
    return array(
        'none' => __( 'None', 'spyropress' ),
        'left' => __( 'Left', 'spyropress' ),
        'right' => __( 'Right', 'spyropress' ),
    );
}

function spyropress_get_options_link( $fields ) {
    // check for emptiness
    if ( empty( $fields ) ) $fields = array();

    return array_merge( $fields, array(
        array(
            'label' => __( 'URL/Link Setting', 'spyropress' ),
            'type' => 'toggle'
        ),

        array(
            'label' => __( 'Link Text', 'spyropress' ),
            'id' => 'url_text',
            'type' => 'text'
        ),

        array(
            'label' => __( 'URL/Hash', 'spyropress' ),
            'id' => 'url',
            'type' => 'text'
        ),

        array(
            'label' => __( 'Link to Post/Page', 'spyropress' ),
            'id' => 'link_url',
            'type' => 'custom_post',
            'post_type' => array( 'post', 'page' )
        ),

        array( 'type' => 'toggle_end' )
    ) );
}
?>