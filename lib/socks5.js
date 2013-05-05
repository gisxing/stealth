var net = require('net'),
    util = require('util'),
    log = console.log,
    SOCKS_VERSION = 0x5,
    /*
     * Authentication methods
     ************************
     * o  X'00' NO AUTHENTICATION REQUIRED
     * o  X'01' GSSAPI
     * o  X'02' USERNAME/PASSWORD
     * o  X'03' to X'7F' IANA ASSIGNED
     * o  X'80' to X'FE' RESERVED FOR PRIVATE METHODS
     * o  X'FF' NO ACCEPTABLE METHODS
     */
    AUTHENTICATION = {
        NOAUTH: 0x00,
        GSSAPI: 0x01,
        USERPASS: 0x02,
        NONE: 0xFF
    },
    /*
     * o  CMD
     *    o  CONNECT X'01'
     *    o  BIND X'02'
     *    o  UDP ASSOCIATE X'03'
     */
    REQUEST_CMD = {
        CONNECT: 0x01,
        BIND: 0x02,
        UDP_ASSOCIATE: 0x03
    },
    /*
     * o  ATYP   address type of following address
     *    o  IP V4 address: X'01'
     *    o  DOMAINNAME: X'03'
     *    o  IP V6 address: X'04'
     */
    ATYP = {
        IP_V4: 0x01,
        DNS: 0x03,
        IP_V6: 0x04
    },
    STAGE = {
        GRT: 'greeting',
        CONN: 'connection'
    };

function createSocks5Server(cb){
    var server = net.createServer(function(socket){
        // on 'connection'
        socket.buffer = new Buffer(0);
        socket. stage = STAGE.GRT;

        socket.on('error', function(e){
            log('%j', e);
        });


        /*
        client:
        +----+----------+----------+
        |VER | NMETHODS | METHODS  |
        +----+----------+----------+
        | 1  |    1     | 1 to 255 |
        +----+----------+----------+
        response:
        +----+--------+
        |VER | METHOD |
        +----+--------+
        | 1  |   1    |
        +----+--------+
        */
        function grtHandle(socket){
            var chunk = socket.buffer;
            if(chunk.length < 2){
                return STAGE.GRT;
            }

            var ver = chunk[0];
            var nmethods = chunk[1];

            if(ver != SOCKS_VERSION){
                log('Wrong socks version: %d.', ver);
                socket.end();
                return;
            }

            if(chunk.length < 2 + nmethods){
                return STAGE.GRT;
            }

            var methods = [];
            for(var i = 2; i < 2 + nmethods; i++){
                methods.push(chunk[i]);
            }

            var resp = new Buffer(2);
            resp[0] = SOCKS_VERSION;
            if(methods.indexOf(AUTHENTICATION.NOAUTH) != -1){
                resp[1] = AUTHENTICATION.NOAUTH;
                socket.write(resp);
            }else{
                log('Only support noauth. Disconnecting.');
                resp[1] = 0xff;
                socket.end(resp);
            }

            socket.buffer = chunk.slice(2 + nmethods);
            return STAGE.CONN;
        }
        /*
        request format:
        +----+-----+-------+------+----------+----------+
        |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
        +----+-----+-------+------+----------+----------+
        | 1  |  1  | X'00' |  1   | Variable |    2     |
        +----+-----+-------+------+----------+----------+
        resp:
        +----+-----+-------+------+----------+----------+
        |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
        +----+-----+-------+------+----------+----------+
        | 1  |  1  | X'00' |  1   | Variable |    2     |
        +----+-----+-------+------+----------+----------+
        */
        function connHandle(socket, cb){
            var chunk = socket.buffer;
            if(chunk.length < 4){
                return STAGE.CONN;
            }

            var ver = chunk[0];
            var cmd = chunk[1];
            var atyp = chunk[3];

            if(ver != SOCKS_VERSION){
                log('Wrong socks version: %d.', ver);
                socket.end();
                return;
            }
            if(cmd != REQUEST_CMD.CONNECT){
                log('No support of cmd %d.', cmd);
                socket.end();
                return;
            }

            var host;
            var port;
            if(atyp == ATYP.IP_V4){
                host = util.format(
                        '%s.%s.%s.%s',
                        chunk[4],
                        chunk[5],
                        chunk[6],
                        chunk[7]
                );
                port = chunk.readUInt16BE(8);
            }else if(atyp == ATYP.DNS){
                var host_len = chunk[4];
                var offset = 5 + host_len;
                host = chunk.toString('utf8', 5, offset);
                port = chunk.readUInt16BE(offset);
            }else{
                // no ipv6 support
                socket.end();
                return;
            }

            socket.removeListener('data', dataHandle);

            // prepare response for proxy ready
            socket.ready_resp = new Buffer(chunk.length);
            chunk.copy(socket.ready_resp);
            socket.ready_resp[1] = 0x00;

            cb(socket, port, host);
        }

        var stageHandle = {};
        stageHandle[STAGE.GRT] = grtHandle;
        stageHandle[STAGE.CONN] = connHandle;

        function dataHandle(chunk){
            socket.buffer = Buffer.concat([socket.buffer, chunk]);
            socket.stage = stageHandle[socket.stage](socket, cb);
        }

        socket.on('data', dataHandle);
    });

    return server;
}

function proxyReady(socket){
    socket.write(socket.ready_resp);
}

exports.createSocks5Server = createSocks5Server;
exports.proxyReady = proxyReady;
