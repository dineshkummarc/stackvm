#!/usr/bin/env node
var sys = require('sys');
var fs = require('fs');

with ({ x : require('dnode') }) {
    var DNode = x.DNode;
    var Async = x.Async;
}

function Manager () {
    this.vmList = Async(function (f) {
        fs.readdir(__dirname + '/../vm', function (err,files) { f(files) });
    });
}

DNode(new Manager).listen(9100);
