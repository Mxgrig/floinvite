<?php
/**
 * Logo Helper Utility
 * Returns the appropriate logo based on the current date/season
 */

function is_yuletide_season() {
    $month = (int) date('n'); // 1-12
    $day = (int) date('j'); // 1-31

    if ($month === 11 && $day >= 15) {
        return true;
    }
    if ($month === 12) {
        return true;
    }
    if ($month === 1 && $day <= 6) {
        return true;
    }

    return false;
}

function get_logo_path() {
    return is_yuletide_season() ? '../xmas-logo.png' : '../mainflologo.png';
}
