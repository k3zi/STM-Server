<?php
/*
 * If the current post is protected by a password and the visitor has not yet
 * entered the password we will return early without loading the comments.
 */
if ( post_password_required() ) return;

$translate['comment'] = get_setting( 'translate' ) ? get_setting( 'translate-comment', 'Comment' ) : __( 'Comment', 'spyropress' );
$translate['comments'] = get_setting( 'translate' ) ? get_setting( 'translate-comments', 'Comments' ) : __( 'Comments', 'spyropress' );
$translate['comments-off'] = get_setting( 'translate' ) ? get_setting( 'translate-comments-off', 'Comments are closed.' ) : __( 'Comments are closed.', 'spyropress' );

?>

<div id="comments">
<?php if ( ! comments_open() ) { echo '<p class="no-comments">' . $translate['comments-off'] . '</p>'; } ?>
	<?php if ( have_comments() ) { ?>
        <h3 id="comments-title">
		 <?php
            $num_comments = get_comments_number();
            if( $num_comments != 1 )
                printf( '%1$s <span>( %2$s )</span> ', $translate['comments'], number_format_i18n( $num_comments ) );
            else
                printf( '%1$s <span>( %2$s )</span> ', $translate['comment'], number_format_i18n( $num_comments ) );
        ?>
		</h3>

		<ul class="commentlist clearfix">
			<?php
				wp_list_comments( array(
					'format'      => 'html5',
					'short_ping'  => true,
                    'callback' => 'spyropress_comment'
				) );
			?>
		</ul><!-- .comment-list -->

		<?php
			// Are there comments to navigate through?
			if ( get_comment_pages_count() > 1 && get_option( 'page_comments' ) ) :
		?>
		<nav class="navigation comment-navigation" role="navigation">
			<h1 class="screen-reader-text section-heading"><?php _e( 'Comment navigation', 'spyropress' ); ?></h1>
			<div class="nav-previous"><?php previous_comments_link( __( '&larr; Older Comments', 'spyropress' ) ); ?></div>
			<div class="nav-next"><?php next_comments_link( __( 'Newer Comments &rarr;', 'spyropress' ) ); ?></div>
		</nav><!-- .comment-navigation -->
		<?php endif; // Check for comment navigation ?>

	<?php
        }
    ?>


<?php
    $req = get_option( 'require_name_email' );
    $aria_req = ( $req ? " aria-required='true'" : '' );

    $fields = array();
    $fields['author'] = '<input id="author" name="author" type="text" class="text" value="' . esc_attr( $commenter['comment_author'] ) . '"' . $aria_req . ' placeholder="' . __('Name','spyropress') . '" />';
    $fields['email'] = '<input id="email" name="email" type="text" class="text" value="' . esc_attr(  $commenter['comment_author_email'] ) . '"' . $aria_req . ' placeholder="' . __('Email','spyropress') . '" />';
    $fields['url'] = '<input id="url" name="url" type="text" class="text" value="' . esc_attr( $commenter['comment_author_url'] ) . '" placeholder="' . __( 'Website','spyropress' ) . '" />';

    $args = array(
        'fields' => $fields,
        'comment_field' => '<textarea id="comment" name="comment" cols="50" rows="8" class="text textarea" placeholder="'.esc_attr__('Your comment here..','spyropress').'"></textarea>',
        'format' => 'html5',
        'label_submit' => __( 'Post Comment' , 'spyropress' ),
        'title_reply' => __('Leave A Comment','spyropress'),
        'comment_notes_before' => '<p class="comment-notes">' . __( '<small>Your email address will not be published. Required fields are marked</small><span class="required">*</span>' ) . '</p>',
        'comment_notes_after' => ''
    );
    
    comment_form( $args );
?>    
</div><!-- #comments -->