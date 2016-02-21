<?php 
// Setup Instance for view 
$instance = spyropress_clean_array($instance);
//check  
if( empty( $instance['title'] ) ) return;

echo $before_widget;
   
   if( $instance['icons'] ){
        $icons_list = '';
        foreach( $instance['icons'] as $icons ){			
		       $icons_list .= '<li><img src="'. $icons['icon'] .'" alt=""></li>';
        }      
   }      
							
   printf( '<%1$s>%2$s</%1$s>', $instance['html_tag'], $instance['title'] );
   if( $instance['content'] ) echo '<p>'. $instance['content'] .'</p>';
   if(  $icons_list ) echo '<ul class="static-list">'.  $icons_list .'</ul>';
    
echo $after_widget;