;(function($){

$(window).load(function() {
    $('.navigationContent').hide();
	$('.iOS').hide();
});


$(document).ready(function() {
    $('.loupe-gallery').each(function(){
	   var $this = $(this);
       $this.closest('.section').addClass('loupes');
	});

    $('.bx-gallery').each(function(){
	   var $this = $(this);
       $this.closest('.section').addClass('nof');
	});

    $('#navigation').localScroll({
		offset: -80
	});

    $('.pages.widget > li').addClass('cat-item');

	$('#mobile-nav').localScroll({
		offset: -47
	});

    $('.action').localScroll({
		offset: -80
	});

    var sections = $('section'),
        navigation_links = $('nav a');
    sections.waypoint({
        handler: function(direction) {
            var active_section = $(this);

            if (direction === "up") active_section = active_section.prev();
			var active_link = $('nav a[href="#' + active_section.attr("id") + '"]');

            navigation_links.removeClass("current");
            active_link.addClass("current");
	    },
	    offset: '35%'
    });

    // Animation Appear
    $('.animate').each(function() {
        var $this = $(this),
            data = $this.data();

        $this.addClass("appear-animation");

        if($(window).width() > 767) {

            $this.appear(function() {

                if( 'endLeft' in data ) {
                    $this.css( { right: 'auto' } );
                    $this.animate({ left : data.endLeft }, 1200, "easeOutCubic");
                }

                else if( 'endRight' in data ) {
                    $this.css( { left: 'auto' } );
                    $this.animate({ right : data.endRight }, 1200, "easeOutCubic");
                }

                else if( 'endTop' in data ) {
                    $this.css( { bottom: 'auto' } );
                    $this.animate({ top : data.endTop }, 1200, "easeOutCubic");
                }

                else if( 'endBottom' in data ) {
                    $this.css( { top: 'auto' } );
                    $this.animate({ bottom : data.endBottom }, 1200, "easeOutCubic");
                }
            });
        } else {
            $this.addClass("appear-animation-visible");
        }
    });

	$('.gallery-bxslider').bxSlider({
		mode: 'fade',
		touchEnabled: true,
		swipeThreshold: 50,
		oneToOneTouch: true,
		pagerSelector: '#gallery-pager',
		nextText: 'next',
		prevText: 'prev',
		tickerHover: true,
		preloadImages: 'all'
	});

    $('.mc4wp-alert').each(function(){
        var $this = $(this);

        $this.addClass('notification closeable sixteen columns');

        if( $this.hasClass('mc4wp-success') )
            $this.addClass('success');
        if( $this.hasClass('mc4wp-error') )
            $this.addClass('error');

        $this.wrapInner('<p></p>');
        $this.show();
    });

	$(document.body).aetherNotifications();

    $("#top").click(function () {
		return $("body,html").stop().animate({
			scrollTop: 0
		}, 800, "easeOutCubic"), !1;
	});

	$('.navigationButton').click(function() {
		if($('.navigationContent').is(':hidden')) {
			$('.navigationContent').show('slow');
		}
		else {
			$('.navigationContent').hide('slow');
		}
	});

    $('.navigationContent a').click(function(){
		$('.navigationContent').hide('slow');
	});

    //RESPONSIVE VIDEO
	$(".container").fitVids();

	//BLOG SLIDER
	$(".gallery-blog").bxSlider({
		pager: false,
		nextSelector: ".gallery-blog-next",
		prevSelector: ".gallery-blog-prev",
		nextText: "next",
		prevText: "prev"
	});

});


})(jQuery);