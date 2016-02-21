<?php

/**
 * Module: Gallery
 * Gallery Builder
 *
 * @author 		SpyroSol
 * @category 	BuilderModules
 * @package 	Spyropress
 */

class Spyropress_Module_Gallery extends SpyropressBuilderModule {

    /**
     * Constructor
     */
    public function __construct() {

        // Widget variable settings
        $this->path = dirname( __file__ );
        $this->cssclass = 'bx-gallery';
        $this->description = __( 'Gallery Builder', 'spyropress' );
        $this->id_base = 'gallery';
        $this->name = __( 'Gallery', 'spyropress' );

        // Fields
        $this->fields = array (

            array(
                'id' => 'photos',
                'label' => 'Photos',
                'type' => 'repeater',
                'fields' => array(
                    array(
                        'id' => 'thumb',
                        'type' => 'upload'
                    )
                )
            )
        );

        $this->create_widget();
    }

    function widget( $args, $instance ) {

        // extracting info
        extract( $args ); extract( $instance );

        // get view to render
        include $this->get_view();
    }
    
    function generate_item( $item, $atts ) {
        return '<div class="' . $atts['column_class'] . '"><img src="' .$item['thumb']. '" alt=""></div>';
    }
}
spyropress_builder_register_module( 'Spyropress_Module_Gallery' );