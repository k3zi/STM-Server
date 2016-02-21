<?php 
// Setup Instance for view
$instance = spyropress_clean_array($instance);
//check  
if( empty( $instance['title'] ) ) return;

echo $before_widget;
  
    printf( '<%1$s>%2$s</%1$s>',  $instance['html_tag'],  $instance['title'] );
    if( $instance['content'] ) echo '<p>'. $instance['content'] .'</p>';
    if( $instance['link_text'] ) echo '<a href="'. $instance['link_url'] .'" class="button">'. $instance['link_text'] .'<i class="more"></i></a>';

echo $after_widget;