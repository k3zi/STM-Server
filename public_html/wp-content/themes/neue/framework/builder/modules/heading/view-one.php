<?php
// Setup Instance for view
$instance = spyropress_clean_array($instance);

echo $before_widget;

    if( $instance['title'] )
        printf( '<%1$s>%2$s</%1$s>',  $instance['html_tag'],  $instance['title'] );

    if( $instance['content'] )
        echo '<p class="sub-heading twelve columns offset-by-four">'. $instance['content'] .'</p>';
    
    echo '<br class="clear">';
echo $after_widget;