<?php
/**
 * Footer
 */
?>
    <?php spyropress_before_footer(); ?>
    <!-- footer -->
    <footer id="footer">
    <?php
        spyropress_before_footer_content();
        spyropress_get_template_part('part=templates/footer-content');
        spyropress_after_footer_content();
    ?>
    </footer>
    <!-- /footer -->
    <?php spyropress_after_footer(); ?>
<?php spyropress_wrapper_end(); ?>
<?php spyropress_footer(); ?>
<?php wp_footer(); ?>
</body>
</html>