var net = require('net'),
    fs = require('fs'),
    obfus = require('./lib/obfus.js');

// read config
var config = JSON.parse(fs.readFileSync('config.json'));

var server = net.createServer(function(client){
    // connected
    var ob = new obfus.Obfuscator(config.key);
    client.on('data', function(chunk){
        var handshake = ob.explicit(chunk);
        var remoteInfo = JSON.parse(handshake.slice(1, 1 + handshake[0]));
        var remote = net.connect(remoteInfo.port, remoteInfo.host, function(){
            // connected
            client.removeAllListeners('data');
            relay(ob, client, remote);

            // send ready to client
            var resp = new Buffer(1);
            resp[0] = 0x00;
            client.write(ob.obfuscate(resp));

        });
        client.on('close', function(err){
            remote.end();
        });
        remote.on('close', function(err){
            client.end();
        });
        remote.on('error', function(err){
            console.error('Remote error %j.', err);
        });
    });
    client.on('error', function(err){
        console.error('Client error %j.', err);
    });
});

function relay(ob, cSocket, rSocket){
    // relay
    rSocket.on('data', function(chunk){
        cSocket.write(ob.obfuscate(chunk));
        console.info('<- %d bytes', chunk.length);
    });
    cSocket.on('data', function(chunk){
        rSocket.write(ob.explicit(chunk));
        console.info('   %d bytes ->', chunk.length);
    });
}

server.on('error', function(e){
    console.error('Server error: %j.', e);
});

server.listen(config.serverPort, config.serverHost);
console.log('Listen on %s:%d.', config.serverHost, config.serverPort);
