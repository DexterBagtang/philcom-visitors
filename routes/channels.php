<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});


Broadcast::channel('visitors', function ($user) {
    return true; // Or add your authorization logic here
});

Broadcast::channel('visits', function ($user) {
    return true; // Or add your authorization logic here
});
