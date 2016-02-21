<?php

/**
 * Editor OptionType
 *
 * @author 		SpyroSol
 * @category 	UI
 * @package 	Spyropress
 */

function spyropress_ui_editor( $item, $id, $value, $is_widget = false, $is_builder = false ) {

    ob_start();

    // Defaults
    $defaults = array(
        'wpautop' => false,
        'media_buttons' => true,
        'textarea_name' => esc_attr( $item['name'] ),
        'textarea_rows' => esc_attr( $item['rows'] )
    );

    $settings = ( isset( $item['settings'] ) ) ? $item['settings'] : array();
    $settings = wp_parse_args( $settings, $defaults );

    echo '<div ' . build_section_class( 'section-editor section-full', $item ) . '>';
        build_heading( $item, $is_widget );
        build_description( $item );
        echo '<div class="controls">';
            wp_editor( $value, esc_attr( $id ), $settings );
        echo '</div>';
    echo '</div>';

    $ui_content = ob_get_clean();
    if ( $is_widget )
        return $ui_content;
    else
        echo $ui_content;
}

function spyropress_widget_editor( $item, $id, $value, $is_builder = false ) {

    ob_start();

    // collecting attributes
    $atts = array();
    $atts['class'] = 'field builder-rich-text';
    $atts['id'] = esc_attr( $id );
    $atts['name'] = esc_attr( $item['name'] );
    $atts['rows'] = esc_attr( $item['rows'] );

    echo '<div ' . build_section_class( 'section-editor section-full', $item ) . '>';
        build_heading( $item, true );
        build_description( $item );
        echo '<div class="controls">';
            printf( '<textarea %s>%s</textarea>', spyropress_build_atts( $atts ), wp_richedit_pre( $value ) );
        echo '</div>';
    echo '</div>';

    $ui_content = ob_get_clean();

    $js = '
        tinyMCE.init({
            mode:"none",
            onpageload:"",
            width:"787",
            height:"300",
            theme:"advanced",
            skin:"wp_theme",
            language:"",
            theme_advanced_resizing:"",
            theme_advanced_resize_horizontal:"",
            dialog_type:"modal",
            theme_advanced_buttons3:"",
            theme_advanced_buttons4:"",
            theme_advanced_toolbar_location:"top",
            theme_advanced_toolbar_align:"left",
            theme_advanced_statusbar_location:"bottom",
            relative_urls:"",
            remove_script_host:"",
            convert_urls:"",
            apply_source_formatting:"",
            remove_linebreaks:"0",
            paste_convert_middot_lists:"1",
            paste_remove_spans:"1",
            paste_remove_styles:"1",
            gecko_spellcheck:"1",
            entities:"38,amp,60,lt,62,gt",
            accessibility_focus:false,
            tab_focus:":prev,:next",
            save_callback:"",
            wpeditimage_disable_captions:"",';
    
    $btn = $plug = '';
    
    if( current_theme_supports( 'spyropress-shortcode-generator' ) ) {
        $btn = ',spyropress_shortcodes';
        $plug = ',-spyropressShortcodes';
    }
    
    $js .= 'spellchecker_languages:"+English=en,Danish=da,Dutch=nl,Finnish=fi,French=fr,German=de,Italian=it,Polish=pl,Portuguese=pt,Spanish=es,Swedish=sv",
            theme_advanced_buttons1:"bold,italic,underline,strikethrough,|,bullist,numlist,blockquote,|,justifyleft,justifycenter,justifyright,justifyfull,|,link,unlink,|,spellchecker,wp_fullscreen,code,wp_adv,|, spyropress_image' . $btn . '",
            theme_advanced_buttons2:"formatselect,forecolor,|,copy,cut,paste,pastetext,pasteword,removeformat,|,charmap,|,outdent,indent,|,undo,redo,hr,sub,sup",
            plugins:"inlinepopups,spellchecker,tabfocus,paste,media,fullscreen,wordpress,wpeditimage,wpgallery,wplink,wpdialogs,-spyropressImage' . $plug . ',wpfullscreen"';

    $js .= '});';

    if ( ! $is_builder )
        add_jquery_ready( $js );
    else
        $ui_content .= sprintf( '<script type="text/javascript">
                                    //<![CDATA[
                                        %s
                                    //]]>
                                </script>', $js );
    return $ui_content;
}

?>