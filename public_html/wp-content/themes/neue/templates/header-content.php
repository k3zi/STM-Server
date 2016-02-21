<?php $page_options = get_post_meta( get_the_ID(), '_page_options', true ); ?>
<div id="mobile-nav">
	<div class="container clearfix">
		<div>
			<div class="navigationButton sixteen columns clearfix">
				<img src="<?php assets_img_e( 'mobile-nav.png' ); ?>" alt="Navigation" width="29" height="17" />
			</div>
			<div class="navigationContent sixteen columns clearfix">
                <?php
                    $args = array(
                        'container_class' => false,
                        'menu_class' => '',
                        'menu_id' => '',
                        'echo' => false
                    );
                    
                    if( !empty( $page_options['onepage_menu'] ) )
                        $args['menu'] = $page_options['onepage_menu'];
                    else
                        $args['theme_location'] = 'primary';
                    $url = is_front_page() ? '#' : home_url('/#');
                    $menu = wp_nav_menu( $args );
                    echo str_replace( '#HOME_URL#', $url, $menu );
                ?>
			</div>
		</div>
	</div>
</div>
<header class="clearfix">
	<div class="container">
		<?php spyropress_logo( array( 'tag'=> 'div' , 'container_class' => 'three columns' ) ); ?>
		<nav id="navigation" class="thirteen columns">
		<?php
            $args = array(
                'container_class' => false,
                'menu_class' => '',
                'menu_id' => '',
                'echo' => false
            );
            
            if( !empty( $page_options['onepage_menu'] ) )
                $args['menu'] = $page_options['onepage_menu'];
            else
                $args['theme_location'] = 'primary';
                        
            $url = is_front_page() ? '#' : home_url('/#');
            $menu = wp_nav_menu( $args );
            echo str_replace( '#HOME_URL#', $url, $menu );
            ?>
		</nav>
	</div>
</header>