<?php

/**
 * Module: Sub-Pages
 * A list of sub-page titles or excerpts.
 *
 * @author 		SpyroSol
 * @category 	BuilderModules
 * @package 	Spyropress
 */

class Spyropress_Row_Options extends SpyropressBuilderModule {

    public function __construct() {

        $this->cssclass = 'row-options';
        $this->description = __( 'Set row options and styling here.', 'spyropress' );
        $this->id_base = 'spyropress_row_options';
        $this->name = __( 'Row Options', 'spyropress' );
        $this->show_custom_css = true;

        $locations = get_registered_nav_menus();
        $menus = wp_get_nav_menus();
        $menu_options = array();

        if ( isset( $locations ) && count( $locations ) > 0 && isset( $menus ) && count( $menus ) > 0 ) {
            foreach ( $menus as $menu ) {
                $menu_options[$menu->term_id] = $menu->name;
            }
        }
       
        // Fields
        $this->fields = array(

            array(
                'id' => 'show',
                'type' => 'checkbox',
                'options' => array(
                    '1' => __( '<strong>Disable this row temporarily</strong>','spyropress' )
                )
            ),

            array(
                'label' => 'Styles',
                'id' => 'styles',
                'type' => 'multi_select',
                'options' => array(
                    'centered' => 'Centered',
                    'push-bottom' => 'Push Bottom',
                    'divider' => 'Divider',
                    'static' => 'Static Content'
                )
            )
        );

        if( !empty( $menu_options ) ) {

            $this->fields[] = array(
                'label' => 'OnePage Menu Builder',
                'type' => 'sub_heading'
            );

            $this->fields[] = array(
                'label' => 'Select Menu',
                'id' => 'menu_id',
                'type' => 'select',
                'options' => $menu_options
            );

            $this->fields[] = array(
                'label' => 'Menu Label',
                'id' => 'menu_label',
                'type' => 'text'
            );
        }

        $this->create_widget();

        add_filter( 'builder_save_row_css', array( $this, 'compile_css' ), 10, 3 );
    }

    function after_validate_fields( $instance = '' ) {

        if(
            isset( $instance['menu_id'] ) && isset( $instance['menu_label'] ) &&
            !empty( $instance['menu_id'] ) && !empty( $instance['menu_label'] )
        ) {

            $key = sanitize_key( $instance['menu_label'] );
            if( isset( $instance['custom_container_id'] ) && !empty( $instance['custom_container_id'] ) )
                 $key = $instance['custom_container_id'];
            else
                $instance['custom_container_id'] = $key;
            $menu_link = '#HOME_URL#' . $key;
            $is_link = false;

            $menu_items = wp_get_nav_menu_items( $instance['menu_id'] );
            foreach ( $menu_items as $menu_item ) {
                if ( $menu_item->url == $menu_link ) {
                    $is_link = true;
                    break;
                }
            }

            if ( ! $is_link ) {
                wp_update_nav_menu_item( $instance['menu_id'], 0, array(
                    'menu-item-title' => $instance['menu_label'],
                    'menu-item-classes' => 'internal',
                    'menu-item-url' => $menu_link,
                    'menu-item-status' => 'publish' ) );

                update_option( 'menu_check', true );
            }
        }
        return $instance;
    }

    function compile_css( $row_id, $instance, $old_instance ) {

        $row_id = isset( $instance['custom_container_id'] ) ? $instance['custom_container_id'] : $row_id;
        $row_class = isset( $instance['custom_container_class'] ) ? $instance['custom_container_class'] : '';
        $insertion = '';

        // row custom css
        if ( isset( $instance['row_custom_css'] ) && $instance['row_custom_css'] ) {
            $custom_css = $instance['row_custom_css'];

            /**
             * @deprecated {this_row}
             * @version 3.10
             */
            $custom_css = str_replace( '{this_row}', '#' . $row_id, $custom_css );

            /**
             * @since 3.10
             */
            $custom_css = str_replace( '{row_id}', '#' . $row_id, $custom_css );
            $custom_css = str_replace( '{row_class}', '.' . spyropress_uglify_cssclass( $row_class ), $custom_css );

            $insertion .= $custom_css;
        }

        return $insertion;
    }
}