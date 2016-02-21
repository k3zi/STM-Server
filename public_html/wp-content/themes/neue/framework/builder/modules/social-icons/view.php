<?php
    //check
    if ( empty( $socials ) ) return;
    echo $before_widget;
?>
<div class="clearfix">
    <div class="small-border"></div>
    <ul class="social-list clearfix">
        <?php
            foreach( $socials as $social ){
                echo '<li><a href="'. $social['url'] .'" target="_blank"><img src="'. $social['network'] .'" alt=""></a></li>';
            }
        ?>
    </ul>
</div>

<?php echo $after_widget; ?>