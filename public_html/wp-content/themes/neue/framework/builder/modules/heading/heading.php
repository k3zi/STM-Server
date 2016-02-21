<?php

/**
 * Module: Heading
 * Add headings into the page layout wherever needed.
 *
 * @author 		SpyroSol
 * @category 	BuilderModules
 * @package 	Spyropress
 */

class Spyropress_Module_Heading extends SpyropressBuilderModule {

    public function __construct() {
        
        // Widget variable settings
        $this->path = dirname(__file__);
        $this->cssclass = 'module-heading';
        $this->description = __( 'Add headings into the page layout wherever needed.', 'spyropress' );
        $this->id_base = 'spyropress_heading';
        $this->name = __( 'Heading', 'spyropress' );
        
        //templates
        $this->templates['view-one'] = array('view' => 'view-one.php', 'label' =>__('Simple Style', 'spyropress'));
        $this->templates['view-two'] = array('view' => 'view-two.php', 'label' =>__('Link Style', 'spyropress'));
        $this->templates['view-three'] = array('view' => 'view-three.php', 'label' =>__('Icon Style', 'spyropress'));
        
        // Fields
        $this->fields = array(
            array(
                'label' => __('Template', 'spyropress'),
                'id' => 'template',
                'class' => 'enable_changer section-full',
                'type' => 'select',
                'options' => $this->get_option_templates()
            ),
                
            array(
                'label' => __( 'Heading Title', 'spyropress' ),
                'id' => 'title',
                'type' => 'text',
            ),
            
            array(
                'label' => __( 'HTML Tag', 'spyropress' ),
                'id' => 'html_tag',
                'type' => 'select',
                'options' => array(
                    'h1' => __( 'H1', 'spyropress' ),
                    'h2' => __( 'H2', 'spyropress' ),
                    'h3' => __( 'H3', 'spyropress' ),
                    'h4' => __( 'H4', 'spyropress' ),
                    'h5' => __( 'H5', 'spyropress' ),
                    'h6' => __( 'H6', 'spyropress' )
                ),
                'std' => 'h1'
            ),
            
            array(
                'label' => __( 'Content', 'spyropress' ),
                'id' => 'content',
                'type' => 'textarea',
                'rows' => 4
            ),
            
            array(
                'label' => __( 'Link Text', 'spyropress' ),
                'id' => 'link_text',
                'class' => 'template view-two',
                'type' => 'text',
            ),
            
            array(
                'label' => __( 'Link Url', 'spyropress' ),
                'id' => 'link_url',
                'class' => 'template view-two',
                'type' => 'text',
            ),
            
            array(
                'label' => __('Icons', 'spyropress'),
                'id' => 'icons',
                'type' => 'repeater',
                'class' => 'template view-three',
                'fields' => array(
                                array(
                                    'label' =>__('Icons', 'spyropress'),
                                    'id' => 'icon',
                                    'type' => 'upload',
                                )
                )
            ),
        );

        $this->create_widget();
    }

    function widget( $args, $instance ) {

        // extracting info
        extract( $args ); extract( $instance );
        
        // get view to render
        include $this->get_view( $template );
    }
}
//register module class Spyropress_Module_Heading.
spyropress_builder_register_module( 'Spyropress_Module_Heading' );

?>