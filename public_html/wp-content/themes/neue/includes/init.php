<?php

/**
 * Init Theme Related Settings
 */

/** Internal Settings **/
require_once 'version.php';

/**
 * Required and Recommended Plugins
 */
function spyropress_register_plugins() {

    /**
     * Array of plugin arrays. Required keys are name and slug.
     * If the source is NOT from the .org repo, then source is also required.
     */
    $plugins = array(

        // Wordpress SEO
        array(
            'name'      => 'WordPress SEO by Yoast',
            'slug'      => 'wordpress-seo',
            'required'  => false,
        ),

        // Contact Form 7
        array(
            'name'      => 'Contact Form 7',
            'slug'      => 'contact-form-7',
            'required'  => true,
        ),
        
        array(
            'name'      => 'MailChimp',
            'slug'      => 'mailchimp-for-wp',
            'required'  => false,
        ),
        
        array(
            'name' => 'Post Format UI',
            'required' => true,
            'slug' => 'wp-post-formats-develop',
            'source' => include_path() . 'plugins/wp-post-formats-develop.zip'
        )
    );

    tgmpa( $plugins );
}
add_action( 'tgmpa_register', 'spyropress_register_plugins' );

/**
 * Add modules and tempaltes to SpyroBuilder
 */
function spyropress_register_builder_modules( $modules ) {

    $path = dirname(__FILE__);
    
    $modules[] = 'modules/loupe/loupe.php';
    $modules[] = 'modules/heading/heading.php';
    $modules[] = 'modules/icon-teaser/icon-teaser.php';
    $modules[] = 'modules/html/html.php';
    $modules[] = 'modules/divider/divider.php';
    $modules[] = 'modules/gallery/gallery.php';
    $modules[] = 'modules/social-icons/social-icons.php';

    return $modules;
}
add_filter( 'builder_include_modules', 'spyropress_register_builder_modules' );

/**
 * Define the row wrapper html
 */
function spyropress_row_wrapper( $row_ID, $row ) {
    
    // CssClass
    $section_class = array( 'section' );
    if( isset( $row['options']['custom_container_class'] ) && !empty( $row['options']['custom_container_class'] ) )
        $section_class[] = $row['options']['custom_container_class'];
    
    if( isset( $row['options']['styles'] ) && !empty( $row['options']['styles'] ) )
        $section_class[] = join( ' ', $row['options']['styles'] );
    
    $row_html = sprintf( '
        <section id="%1$s" class="%2$s %3$s">
            %4$s
        </section>', $row_ID, spyropress_clean_cssclass( $section_class ), get_row_class( true ), builder_render_frontend_columns( $row['columns'] )
    );

    return $row_html;
}
add_filter( 'spyropress_builder_row_wrapper', 'spyropress_row_wrapper', 10, 2 );

/**
 * Include Widgets
 */
function spyropress_register_widgets( $widgets ) {
    
    $path = dirname(__FILE__) . '/widgets/';

    $custom = array(
        $path . 'default-widgets.php'
    );

    return array_merge( $widgets, $custom );
}
add_filter( 'spyropress_register_widgets', 'spyropress_register_widgets' );

/**
 * Unregister Widgets
 */
function spyropress_unregister_widgets( $widgets ) {
    
    $custom = array(
        'WP_Widget_Archives',
        'WP_Widget_Calendar',
        'WP_Widget_Categories',
        'WP_Widget_Recent_Comments',
        'WP_Nav_Menu_Widget',
        //'WP_Widget_Links',
        'WP_Widget_Meta',
        'WP_Widget_Pages',
        'WP_Widget_Recent_Posts',
        //'WP_Widget_RSS',
        //'WP_Widget_Search',
        'WP_Widget_Tag_Cloud',
        //'WP_Widget_Text',
        
    );

    return array_merge( $widgets, $custom );
}
add_filter( 'spyropress_unregister_widgets', 'spyropress_unregister_widgets' );

/**
 * Comment Callback
 */
if( !function_exists( 'spyropress_comment' ) ) :
function spyropress_comment( $comment, $args, $depth ) {
    $translate['comment-reply'] = get_setting( 'translate' ) ? get_setting( 'comment-reply', 'Reply' ) : __( 'Reply', 'spyropress' );
	$GLOBALS['comment'] = $comment;
	switch ( $comment->comment_type ) :
		case 'pingback' :
		case 'trackback' :
	?>
	<li class="post pingback">
		<p><?php _e( 'Pingback:', 'spyropress' ); ?> <?php comment_author_link(); ?><?php edit_comment_link( __( 'Edit', 'spyropress' ), '<span class="edit-link">', '</span>' ); ?></p>
	<?php
			break;
		default :
	?>
    <li <?php comment_class(); ?> id="li-comment-<?php comment_ID(); ?>">
   	    <div class="comment-body">
            <div class="comment-author">
    			<?php echo get_avatar( $comment, 43 ); ?>					
    	    </div>
        	<cite class="fn">	<a href="<?php comment_author_url(); ?>"><?php comment_author(); ?></a></cite>
            <div class="comment-meta">
                <h6><a href="#"><?php printf( __( '%1$s at %2$s', 'spyropress' ), get_comment_date(), get_comment_time() ) ?></a> / 
                    <?php
                        comment_reply_link( array_merge( $args, array(
                            'depth' => $depth,
                            'reply_text' => __('Reply','spyropress'),
                            'max_depth' => $args['max_depth'],
                        ) ) );
                    ?>
                </h6>
            </div>
       		<?php if ( $comment->comment_approved == '0' ) { ?>
                <em class="comment-awaiting-moderation"><?php _e( 'Your comment is awaiting moderation.', 'spyropress' ); ?></em><br />
            <?php
                }
                comment_text();
            ?>
  	     </div>
	<?php
			break;
	endswitch;
}
endif;

/**
 * Pagination Defaults
 */
function spyropress_pagination_defaults( $defaults = array() ) {
    
    $defaults['style'] = 'list';
    $defaults['options']['pages_text'] = '';    
    
    return $defaults;
}
add_filter( 'spyropress_pagination_defaults', 'spyropress_pagination_defaults' );

/**
 * oEmbed Modifier
 */
function oembed_modifier( $html ) {
    preg_replace( '/(width|height|frameborder)="\d*"\s/', "", $html );
    return '<div class="video-wrapper">'.preg_replace( '/(width|height|frameborder)="\d*"\s/', '/(width|height|frameborder)="\d*"\s/', $html ).'</div>';
}
add_filter( 'embed_oembed_html', 'oembed_modifier' );
add_filter( 'oembed_result', 'oembed_modifier' );


function spyropress_home_section() {
    if ( is_front_page() )
        get_template_part( 'templates/home', 'section' );
}
add_action( 'spyropress_before_post_content', 'spyropress_home_section' );