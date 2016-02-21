<?php

/**
 * Module: Social Icon List
 *
 * @author 		SpyroSol
 * @category 	BuilderModules
 * @package 	Spyropress
 */

class Spyropress_Module_Social_Icon extends SpyropressBuilderModule{

    /**
     * Constructor
     */
    public function __construct(){

        // Widget variable settings
        $this->path = dirname( __file__ );
        $this->cssclass = 'module-social-list';
        $this->description = __( 'Display a list of social networks.', 'spyropress' );
        $this->id_base = 'social_list';
        $this->name = __( 'Social Icon', 'spyropress' );

        // Fields
        $this->fields = array(array(
                'label' => __( 'Social', 'spyropress' ),
                'type' => 'repeater',
                'id' => 'socials',
                'fields' => array(
                    array(
                        'label' => __( 'Network Icon', 'spyropress' ),
                        'id' => 'network',
                        'type' => 'upload',
                    ),    
                    array(
                        'label' => __( 'URL', 'spyropress' ),
                        'id' => 'url',
                        'type' => 'text',
                    )
                )
            )
        );

        $this->create_widget();
    }

    function widget( $args, $instance ){

        // extracting info
        extract( $args );
        extract( $instance );
        
        // get view to render
        include $this->get_view();
    }

}
//register module class Spyropress_Module_Social_Icon.
spyropress_builder_register_module('Spyropress_Module_Social_Icon');

?>