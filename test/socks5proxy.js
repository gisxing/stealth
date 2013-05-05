var net = require('net'),
    socks5 = require('../lib/socks5.js');

var HOST = 'localhost',
    PORT = '1080';

var proxyServer = socks5.createSocks5Server(function(clnSocket, rPort, rHost){
    // after proxy hanshake
    var remote = net.connect(rPort, rHost, function(){
        // connected, send ready to client
        relay(clnSocket, remote);
        socks5.proxyReady(clnSocket);
    });

});

function relay(cSocket, rSocket){
    // relay
    rSocket.on('data', function(chunk){
        cSocket.write(chunk);
    });
    cSocket.on('data', function(chunk){
        rSocket.write(chunk);
    });
    rSocket.on('close', function(err){
        cSocket.end();
        console.log('Remote closed.');
    });
    cSocket.on('close', function(err){
        rSocket.end();
        console.log('Client closed.');
    });
}

proxyServer.on('error', function(e){
    console.error('Server error: %j.', e);
});

proxyServer.listen(PORT, HOST);
console.log('Listen on %s:%d.', HOST, PORT);
