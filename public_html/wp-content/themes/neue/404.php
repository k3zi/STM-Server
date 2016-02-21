<?php
/**
 * 404 page.
 *
 * @package Cutting Edge
 * @author Spyropress
 * @link http://spyropress.com
 */

get_header(); 

$translate['404-title'] = get_setting( 'translate' ) ? get_setting( 'error-404-title', 'Ooops... Error 404' ) : __( 'Ooops... Error 404', 'spyropress' );
$translate['404-subtitle'] = get_setting('translate') ? get_setting( 'error-404-subtitle', 'We`re sorry, but the page you are looking for doesn`t exist.' ) : __( 'We`re sorry, but the page you are looking for doesn`t exist.', 'spyropress' );
$translate['404-text'] = get_setting('translate') ? get_setting( 'error-404-text', 'Please check entered address and try again <em>or</em>' ) : __( 'Please check entered address and try again <em>or</em>', 'spyropress' );
$translate['404-btn'] = get_setting('translate') ? get_setting( 'error-404-btn', 'go to homepage' ) : __( 'go to homepage', 'spyropress' );
?>
<section class="title container">
    <div class="sixteen columns">
        
        <!-- 404 page -->
		<div class="error-404">
			<h1 class="entry-title"><?php echo $translate['404-title']; ?></h1>
			<h4><?php echo $translate['404-subtitle']; ?></h4>
			<div class="entry-content">
                <p><span class="check"><?php echo $translate['404-text']; ?></span> <a href="<?php echo site_url(); ?>"><?php echo $translate['404-btn']; ?> <span>&rarr;</span></a></p>
            </div>
		</div>
        
    </div>
</section>    
<?php get_footer(); ?>