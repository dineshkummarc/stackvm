#!/usr/bin/env node
var sys = require('sys');
var fs = require('fs');
var proc = require('child_process');
var DNode = require('dnode').DNode;

function VM (image) {
    this.__defineGetter__('image', function () { return image });
    
    var port = null;
    this.__defineGetter__('port', function () { return port });
    
    var power = 'off';
    this.__defineGetter__('power', function () { return power });
    
    var pid = null;
    
    this.spawn = function (p) {
        port = p;
        power = 'on';
        pid = proc.spawn(
            'qemu', [ '-vnc', ':' + (p - 5900) + '.0', vmDir + '/' + vm ]
        );
        pid.addListener('exit', function () { power = 'off' });
    };
    
    this.shutdown = function (vm) {
        pid.kill('SIGHUP');
    };
}

function elems (obj) {
    var acc = [];
    for (var i in obj) {
        acc.push(obj[i]);
    }
    return acc;
}

function Manager () {
    var manager = this;
    var vms = {};
    var vmDir = __dirname + '/../vm';
    
    function nextPort () {
        var ports = elems(vms).map(function (vm) { return vm.port });
        for (var port = 5900; port in ports; port++);
        return port;
    }
    
    process.addListener('exit', function () {
        for (var i in vms) vms[i].stop();
    });
    
    this.vmList = DNode.async(function (f) {
        fs.readdir(vmDir, function (err,files) { f(files) });
    });
    
    this.power = function (im) {
        return vms[im].power;
    };
    
    this.spawn = function (im) {
        var port = nextPort();
        vms[im].spawn(port);
        return port;
    };
     
    this.shutdown = function (im) {
        vms[im].shutdown();
    };
    
    // populate vms list
    this.vmList(function (ims) {
        ims.forEach(function (im) {
            vms[im] = new VM(im);
        });
    });
}

DNode(new Manager).listen(9100);
