<?php

/**
 * Module: Icon Teaser
 * Display a brief text with a link and use hundreds of built-in icons
 *
 * @author 		SpyroSol
 * @category 	BuilderModules
 * @package 	Spyropress
 */

class Spyropress_Module_Icon_Teaser extends SpyropressBuilderModule {

    /**
     * Constructor
     */
    public function __construct() {

        // Widget variable settings
        $this->path = dirname(__FILE__);
        $this->cssclass = 'module-icon-teaser';
        $this->description = __( 'Display a brief text with a link and use of icons.', 'spyropress' );
        $this->id_base = 'spyropress_icon_teaser';
        $this->name = __( 'Icon Teaser', 'spyropress' );

        // Fields
        $flds = array(
            array(
                'label' => __( 'Title', 'spyropress' ),
                'id' => 'title',
                'type' => 'text'
            ),
            
            array(
                'label' => __( 'Upload Icon', 'spyropress' ),
                'id' => 'icon',
                'type' => 'upload'
            ),

            array(
                'label' => __( 'Content', 'spyropress' ),
                'id' => 'content',
                'type' => 'textarea',
                'rows' => 6
            )
        );
        
        $this->fields = array (
            array(
                'id' => 'icons',
                'type' => 'repeater',
                'item_title' > 'title',
                'fields' => $flds
            )
        );
        
        $this->create_widget();
    }

    function widget( $args, $instance ) {
        
        // extracting info
        extract( $args ); extract( $instance  );
        
        if( empty( $icons ) ) return;
        
        // get view to render
        include $this->get_view();
    }
    
    function generate_item( $item, $atts ) {
        
        extract( $item );
        
        if( $icon ) $icon = '<img alt="" src="' . $icon . '">';
        
        echo '
        <div class="' . $atts['column_class'] . '">
            ' . $icon . '
            <h3>' . $title . '</h3>
            ' . wpautop( $content ) . '
        </div>';
    }

}
spyropress_builder_register_module( 'Spyropress_Module_Icon_Teaser' );