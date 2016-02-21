<?php

//check
if( empty( $photos ) ) return;

$atts = array(
    'callback' => array( $this, 'generate_item' ),
    'columns' => 3,
    'row_container' => 'li',
    'row_class' => '',
    'column_class' => 'screenshot'
);

echo $before_widget;
    
    echo '<ul class="gallery-bxslider clearfix">';
    
        echo spyropress_column_generator( $atts, $photos );
    
    echo '</ul><!-- Pager --><div id="gallery-pager"></div><div class="small-border"></div>';
    
echo $after_widget;