<?php

/**
 * Module: Loupe
 * Loupe Gallery Builder
 *
 * @author 		SpyroSol
 * @category 	BuilderModules
 * @package 	Spyropress
 */

class Spyropress_Module_Loupe extends SpyropressBuilderModule {

    /**
     * Constructor
     */
    public function __construct() {

        // Widget variable settings
        $this->path = dirname( __file__ );
        $this->cssclass = 'loupe';
        $this->description = __( 'Loupe Gallery builder', 'spyropress' );
        $this->id_base = 'loupe';
        $this->name = __( 'Loupe Gallery', 'spyropress' );

        // Fields
        $this->fields = array (

            array (
                'label' => __( 'Photo - Thumbnail', 'spyropress' ),
                'id' => 'thumb',
                'type' => 'upload'
            ),

            array (
                'label' => __( 'Photo - Full', 'spyropress' ),
                'id' => 'full',
                'type' => 'upload'
            ),

            array (
                'label' => __( 'Click Tooltip', 'spyropress' ),
                'id' => 'click',
                'type' => 'text',
                'std' => 'Click and drag'
            ),

            array (
                'label' => __( 'Touch Tooltip', 'spyropress' ),
                'id' => 'touch',
                'type' => 'text',
                'std' => 'Touch and move'
            )
        );

        $this->create_widget();
    }

    function widget( $args, $instance ) {

        extract( $instance );
        
        $them_layout = get_setting( 'theme-skin' );
        $place = ( $them_layout == 'android' ) ? 'placeholder_and' : 'placeholder';

        echo '
        <div class="loupe-gallery">
    		<div class="loupe-container">
    			<figure class="loupe-figure">
    				<div class="loupe" data-initplacement="-40,-100" data-boundingbox="-30,-20,410,180" data-scale-ratio="2" data-src="' . $full . '" data-displacementmap="'. assets_img() .'zoom/loupedisplacementmap.png">
    					<img class="loupe-image" src="'. assets_img() .'zoom/loupe.png" width="245" height="257" alt=""/>
    					<div class="tooltip click">'. $click .'</div>
    				 	<div class="tooltip touch">'. $touch .'</div>
    				</div>
    				<div id="gallery-loupe">
    					<img class="gallery-content content loupeView" src="' . $thumb . '" width="559" height="316" alt=""/>
    				</div>
    			</figure>
    			<img class="loupe-still" src="'. assets_img() .'zoom/' . $place . '.png" width="940" height="415" alt=""/>
    		</div>
    	</div>';
    }
}
spyropress_builder_register_module( 'Spyropress_Module_Loupe' );