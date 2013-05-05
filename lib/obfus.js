function Obfuscator(key){
    this.key = new Buffer(key);
    this.obfKeyIdx = 0; // for obfuscate
    this.expKeyIdx = 0; // for explicit
}

Obfuscator.prototype.nextObfKeyByte = function(){
    this.obfKeyIdx = (this.obfKeyIdx + 1) % this.key.length;
    return this.key[this.obfKeyIdx];
};

Obfuscator.prototype.nextExpKeyByte = function(){
    this.expKeyIdx = (this.expKeyIdx + 1) % this.key.length;
    return this.key[this.expKeyIdx];
};

Obfuscator.prototype.obfuscate = function(data){
    var res = new Buffer(data.length);
    for(var i = 0; i < data.length; i++){
        res[i] = data[i] ^ this.nextObfKeyByte();
    }
    return res;
};

Obfuscator.prototype.explicit = function(data){
    var res = new Buffer(data.length);
    for(var i = 0; i < data.length; i++){
        res[i] = data[i] ^ this.nextExpKeyByte();
    }
    return res;
};

exports.Obfuscator = Obfuscator;
