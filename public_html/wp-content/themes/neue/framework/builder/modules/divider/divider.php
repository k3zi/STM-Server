<?php

/**
 * Module: Divider 
 * Separate sections of the layout.
 *
 * @author 		SpyroSol
 * @category 	BuilderModules
 * @package 	Spyropress
 */

class Spyropress_Module_Divider extends SpyropressBuilderModule {

    public function __construct() {

        // Widget variable settings
        $this->path = dirname( __file__ );
        $this->description = __( 'Separate sections of the layout.', 'spyropress' );
        $this->id_base = 'spyropress_divider';
        $this->name = __( 'Divider', 'spyropress' );
        
        $this->fields = array(
            array(
                'type' => 'select',
                'id' => 'style',
                'label' => 'Styles',
                'options' => array(
                    'small' => 'Small Border'
                )
            )
        );
        $this->create_widget();

    }

    function widget($args, $instance) {
        
        // outputs the content of the widget
        $style = '';
        extract( $instance );
        
        if( 'small' == $style ) {
            echo '<div class="small-border"></div>';
        }
        else
            echo '<br class="clear"> <!-- Separator -->';
    }

}
//register module class Spyropress_Module_Divider
spyropress_builder_register_module('Spyropress_Module_Divider');

?>