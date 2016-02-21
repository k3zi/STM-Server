<?php
    $section_bg = get_setting( 'header-image' );
    $section_bg = ( $section_bg )?'style="background: url('. $section_bg .') no-repeat top right;"' : '';
?>
<section id="hero" class="hero container" <?php echo $section_bg; ?>>
	<div class="sixteen columns alpha omega"><h1><?php  get_setting_e('topbar_teaser'); ?></h1></div>
	<ul class="action sixteen columns alpha omega">
    <?php
        $header_btn_enb = get_setting( 'header_btn_enb' );
        if( !empty( $header_btn_enb ) )
            echo '<li><a class="button" href="'. get_setting('header_link') .'">'. get_setting('header_btn') .'<i class="go"></i></a></li>';
        $gallery_link = get_setting('gallery_link');
        if( !empty( $gallery_link ) )
            echo '<li><a class="button" href="'. get_setting('gallery_url') .'">'. get_setting('gallery_btn') .'<i class="grid"></i></a></li>';
    ?>
	</ul>
</section>