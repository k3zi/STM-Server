<?php

/**
 * Shortcodes
 */

init_shortcode();
function init_shortcode() {

    $shortcodes = array(
        'animate_img'   => 'spyropress_sc_animate_img',
        'frame-img'     => 'spyropress_sc_frame_img',
    );

    foreach( $shortcodes as $tag => $func )
        add_shortcode( $tag, $func );
}

function spyropress_sc_animate_img( $atts = array(), $content = '' ) {
    if( empty( $content ) ) return;

    $default = array(
        'animation' => '',
        'bottom' => '',
        'left' => '',
        'right' => '',
        'top' => '',
        'eleft' => '',
        'eright' => '',
        'etop' => '',
        'ebottom' => ''
    );

    extract( shortcode_atts( $default, $atts ) );

    $style = $cls = array();
    
    if( '' != $right ) $style[] = 'right: ' . $right . 'px;';
    if( '' != $left ) $style[] = 'left: ' . $left . 'px;';
    if( '' != $bottom ) $style[] = 'bottom: ' . $bottom . 'px;';
    if( '' != $top ) $style[] = 'top: ' . $top . 'px;';
    
    if( '' != $top || '' != $right || '' != $bottom || '' != $left ) $cls[] = 'abs';
    if( '' != $etop || '' != $eright || '' != $ebottom || '' != $eleft ) $cls[] = 'animate';
    
    if( '' != $eright ) $data_animation = ' data-end-right="' . $eright . '"';
    if( '' != $eleft ) $data_animation = ' data-end-left="' . $eleft . '"';
    if( '' != $etop ) $data_animation = ' data-end-top="' . $etop . '"';
    if( '' != $ebottom ) $data_animation = ' data-end-bottom="' . $ebottom . '"';

    return '<img class="' . spyropress_clean_cssclass( $cls ) . '" src="' . spyropress_remove_formatting( $content ) . '" style="' . implode( ' ', $style ) . '"' . $data_animation . '>';
}

function spyropress_sc_frame_img( $atts = array(), $content = null, $tag ) {
    $default = array(
        'big' => '',
        'tooltip_click' => '',
        'tooltip_touch' => ''
    );
    extract( shortcode_atts( $default, $atts ) );
    
    $them_layout = get_setting( 'theme-skin' );
    $place = ( $them_layout == 'android' ) ? 'placeholder_and' : 'placeholder';

    return '
    <div class="loupe-gallery">
		<div class="loupe-container">
			<figure class="loupe-figure">
				<div class="loupe" data-initplacement="-40,-100" data-boundingbox="-30,-20,410,180" data-scale-ratio="2" data-src="' . $big . '" data-displacementmap="'. assets_img() .'zoom/loupedisplacementmap.png">
					<img class="loupe-image" src="'. assets_img() .'zoom/loupe.png" width="245" height="257" alt=""/>
					<div class="tooltip click">'. $tooltip_click .'</div>
				 	<div class="tooltip touch">'. $tooltip_touch .'</div>
				</div>
				<div id="gallery-loupe">
					<img class="gallery-content content loupeView" src="' . $content . '" width="559" height="316" alt=""/>
				</div>
			</figure>
			<img class="loupe-still" src="'. assets_img() .'zoom/' . $place . '.png" width="940" height="415" alt=""/>
		</div>
	</div>';
}