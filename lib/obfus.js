function Obfuscator(key){
    this.key = new Buffer(key);
}

Obfuscator.prototype.proc = function(data){
    var res = new Buffer(data.length);
    for(var i = 0; i < data.length; i++){
        res[i] = data[i] ^ this.key[i % this.key.length];
    }
    return res;
};

exports.Obfuscator = Obfuscator;

