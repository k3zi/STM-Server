<div class="container">
	<ul class="footer-action">
    <?php
    $footer_btn = get_setting('footer_btn_enb');
    if( !empty( $footer_btn ) )
        echo '<li><a class="button small" href="'. get_setting('footer_link') .'">'. get_setting('footer_btn') .'<i class="go small"></i></a></li>';

    $top_scroller = get_setting('top_scroller');
    if( !empty( $top_scroller ) )
        echo '<li><a id="top" class="button small" href="#">'. get_setting('scroller_text') .'<i class="top"></i></a></li>';
    ?>
	</ul>
	<p class="copyright"><?php get_setting_e('footer_copyright'); ?> </p>
</div>