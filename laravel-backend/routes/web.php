<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response('<html><body style="margin:0;background:#000;display:flex;height:100vh;align-items:center;justify-content:center"><span style="color:#555;font-size:2rem;font-family:sans-serif;letter-spacing:.2em">FlavorFind</span></body></html>');
});
