<?php
/**
 * The base configurations of the WordPress.
 *
 * This file has the following configurations: MySQL settings, Table Prefix,
 * Secret Keys, WordPress Language, and ABSPATH. You can find more information
 * by visiting {@link http://codex.wordpress.org/Editing_wp-config.php Editing
 * wp-config.php} Codex page. You can get the MySQL settings from your web host.
 *
 * This file is used by the wp-config.php creation script during the
 * installation. You don't have to use the web site, you can just copy this file
 * to "wp-config.php" and fill in the values.
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'stream_wp');

/** MySQL database username */
define('DB_USER', 'stream_admin');

/** MySQL database password */
define('DB_PASSWORD', 'PWr82T9BaDKwZW6u1L');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         '[~=^YV1s-#BG($vTbR?X)1$G2a[VXQ:y,3IZ=YG<[-Q;,<8nr7zXR,pXg2@.M{X<');
define('SECURE_AUTH_KEY',  '9c8u^2L_(:vxa!>}~</|Pj0VG)!@v#_44/2`9:fpY:sl{LJ)8z@R `BEeas^KML+');
define('LOGGED_IN_KEY',    'Gik/Kn#7.:p,WB:gVy&vXKG7!`ajz>6>nDSRC?76F`k1^}9(9TI.U/-Q-.&/;msA');
define('NONCE_KEY',        '2+xzQ{Jn`l#76}N=_*7bOR$jC]ypx:hghp*fGmk^&F9LdV63Yp-[S*T-~up&T}Cl');
define('AUTH_SALT',        'VM-|-059k5lsju0}r@cM.F$-.qo`XJaBaWF|3w{w^a]SC@EPgV#]#V*sa1RuD_g7');
define('SECURE_AUTH_SALT', 'Z;VT9X3]4Xx$fFv2-VRv~Ys@)DJXFz|A/78fnNb_@a7+XRHcY:x?8ZC2.ZN~^-D[');
define('LOGGED_IN_SALT',   'LFk= X7O-bt9N9rg[yIIv:;Va*,$UDw&%~.EKEd6#d/ZlaJs%<T7;8-@+yl|vqb&');
define('NONCE_SALT',       '[mlN?p=.)Zkw@s.6&jb -1y|6-x-.6e0v!$mKbf,N92)&y^&#kH8S+hEAO3m]6(n');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each a unique
 * prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 */
define('WP_DEBUG', false);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
