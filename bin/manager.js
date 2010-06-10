#!/usr/bin/env node
var sys = require('sys');
var fs = require('fs');
var proc = require('child_process');
var DNode = require('dnode').DNode;

function Manager () {
    var manager = this;
    var status = {};
    var instances = {};
    var vmDir = __dirname + '/../vm';
    
    process.addListener('exit', function () {
        for (var vm in instances) {
            manager.stop(vm);
        }
    });
    
    this.vmList = DNode.async(function (f) {
        fs.readdir(vmDir, function (err,files) { f(files) });
    });
    
    this.status = function (vm) {
        return status[vm] || 'shutdown';
    };
    
    this.start = function (vm) {
        if (!(vm in status)) throw 'No such VM: ' + vm;
        var qemu = proc.spawn('qemu', [ '-vnc', ':0.0', vmDir + '/' + vm ]);
        qemu.addListener('exit', function () { status[vm] = 'shutdown' });
        instances[vm] = qemu;
        status[vm] = 'running';
    };
    
    this.shutdown = function (vm) {
        if (!(vm in status)) throw 'No such VM: ' + vm;
        instances[vm].kill('SIGHUP');
        status[vm] = 'shutdown';
    };
    
    this.vmList(function (vms) {
        vms.forEach(function (vm) {
            status[vm] = 'stopped';
        });
    });
}

DNode(new Manager).listen(9100);
