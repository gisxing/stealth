var net = require('net'),
    socks5 = require('./lib/socks5.js');

var HOST = 'localhost',
    PORT = '1080';

var proxyServer = socks5.createSocks5Server(function(clnSocket, rPort, rHost){
    // after proxy hanshake
    var remote = net.connect(rPort, rHost, function(){
        // connected, send ready to client
        socks5.proxyReady(clnSocket);
    });

    // relay
    remote.on('data', function(chunk){
        clnSocket.write(chunk);
    });
    clnSocket.on('data', function(chunk){
        remote.write(chunk);
    });
    remote.on('close', function(err){
        clnSocket.end();
        console.log('Remote closed.');
    });
    clnSocket.on('close', function(err){
        if(remote){
            remote.end();
        }
        console.log('Client closed.');
    });
});

proxyServer.on('error', function(e){
    console.error('Server error: %j.' , e);
});

proxyServer.listen(PORT, HOST);
console.log('Listen on %s:%d.', HOST, PORT);
