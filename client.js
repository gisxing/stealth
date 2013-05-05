var net = require('net'),
    fs = require('fs'),
    socks5 = require('./lib/socks5.js'),
    obfus = require('./lib/obfus.js');

// read config
var config = JSON.parse(fs.readFileSync('config.json'));

var proxyServer = socks5.createSocks5Server(function(client, rPort, rHost){
    // after proxy hanshake
    var ob = new obfus.Obfuscator(config.key);
    var remote = JSON.stringify({
        host: rHost,
        port: rPort
    });
    var handshake = new Buffer(1 + remote.length);
    handshake[0] = remote.length;
    handshake.write(remote, 1);
    // connect server
    var server = net.connect(config.serverPort, config.serverHost, function(){
        // connected
        server.on('data', function(chunk){
            var serverHandshake = ob.explicit(chunk);
            if(serverHandshake[0] != 0x00){
                server.end();
                client.end();
                return;
            }
            // server ready

            server.removeAllListeners('data');
            relay(ob, client, server);

            // tell client all ready
            socks5.proxyReady(client);
        });
        // handshake with server
        server.write(ob.obfuscate(handshake));
    });

    server.on('close', function(err){
        client.end();
    });
    client.on('close', function(err){
        server.end();
    });
    server.on('error', function(err){
        console.error('Remote error %j.', err);
    });
    client.on('error', function(err){
        console.error('Client error %j.', err);
    });
});

function relay(ob, cSocket, rSocket){
    // relay
    rSocket.on('data', function(chunk){
        cSocket.write(ob.explicit(chunk));
        console.info('<- %d bytes', chunk.length);
    });
    cSocket.on('data', function(chunk){
        rSocket.write(ob.obfuscate(chunk));
        console.info('   %d bytes ->', chunk.length);
    });
}

proxyServer.on('error', function(e){
    console.error('Server error: %j.', e);
});

proxyServer.listen(config.clientPort, config.clientHost);
console.log('Listen on %s:%d.', config.clientHost, config.clientPort);
