<?php
/*
 * Core Spyropress header template
 *
 * Customise this in your child theme by:
 * - Using hooks and your own functions
 * - Using the 'header-content' template part
 * - For example 'header-content-category.php' for category view or 'header-content.php' (fallback if location specific file not available)
 * - Copying this file to your child theme and customising - it will over-ride this file
 *
 * @package Spyropress
 */
?>
<!DOCTYPE html>
<!--[if IE 8 ]><html class="ie" xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-US" lang="en-US"> <![endif]-->
<!--[if (gte IE 9)|!(IE)]><!--><html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>><!--<![endif]-->
<head>
    <meta name="apple-itunes-app" content="app-id=933037647">
    
    <meta property="twitter:account_id" content="4503599627426989" />
    <meta name="appreviewhelper_verify" content="7c69b8ab0db7b0db46dc">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php spyropress_wrapper(); ?>
    <?php spyropress_before_header(); ?>
     <?php
        spyropress_before_header_content();
        spyropress_get_template_part('part=templates/header-content');
        spyropress_after_header_content();
     ?>
    <?php spyropress_after_header(); ?>