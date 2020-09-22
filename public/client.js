// This file's full path is /public/client.js
$(document).ready(function() {
    /* Global io */
    let socket = io();

    socket.on('user count', function(data) {
        console.log(data);
    });

    socket.on('user', data => {
        $('#num-users').text(data.currentUsers + ' users online');
        let message =
            data.name +
            (data.connected ? ' has joined the chat.' : ' has left the chat.');
        $('#messages').append($('<li>').html('<b>' + message + '</b>'));
    });

    // Form submittion with new message in field with id 'm'
    $('form').submit(function() {
        let messageToSend = $('#m').val();
        // Send message to server here?
        $('#m').val('');
        return false; // Prevent form submit from refreshing page
    });
});