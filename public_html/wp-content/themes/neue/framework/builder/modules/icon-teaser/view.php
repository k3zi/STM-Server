<?php

$atts = array(
    'callback' => array( $this, 'generate_item' ),
    'column_class' => 'content-box',
    'columns' => 3
);

echo $before_widget;
    echo spyropress_column_generator( $atts, $icons );
echo $after_widget;