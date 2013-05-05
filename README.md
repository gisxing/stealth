Stealth
=======

What is it?
-----------

Stealth can help you go through the firewall by stealth. It build a socks5 proxy server in local, and relay stream between local and remote server outside firewall in a obfuscated tunnel.

USAGE
-----

1. Install nodejs in both local and remote server.
2. In both local and remote server,
```
cp config.json.sample config.json
```
, and edit config.json.
3. In local, run
```
node client.js
```
, while in remote server, run
```
node server.js
```
.
4. Browser setting, set socks5 proxy of the client's adress and port, for example, localhost:1080.

All done.

You don't wanna see log? Client also can be run like:
```
node client.js 2>error.log >/dev/null &
```
Vice versa.
