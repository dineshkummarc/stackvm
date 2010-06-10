#!/usr/bin/env node
// This program serves stackvm webpages and stackvm streams.
require.paths.unshift(__dirname + '/..');

var sys = require('sys');
var socketio = require('socket.io');

var webserver = require('lib/webserver').webserver;
var VM = require('lib/vm').VM;

var port = Number(process.argv[2]) || 9000;

webserver.listen(port, '0.0.0.0');
sys.log("Webserver running at 0.0.0.0:" + port + ".");

var vms = {};
var DNode = require('dnode').DNode;

DNode.connect(9100, function (dnode) {
    var manager = this;
    
    socketio.listen(webserver, {
        // flashsockets require that pesky 843 port, so forget those
        transports : 'websocket htmlfile xhr-multipart xhr-polling'.split(/\s+/),
        
        onClientConnect : function(client) {
            var client_ip = client.request.connection.remoteAddress;
            sys.log("Client from " + client_ip + " connected.");
        },
        
        onClientDisconnect : function(client) {
            var client_ip = client.request.connection.remoteAddress;
            sys.log("Client from " + client_ip + " disconnected.");
        },
        onClientMessage : function(msg, client) {
            var vm = vms[msg.vmId];
            var f = {
                list : function () { manager.vmList(client.send) },
                spawn : function () {
                    manager.spawn(msg.vmId, function (vmPort) {
                        vms[msg.vmId] = new VM({ port : vmPort });
                    });
                },
                shutdown : function () {
                    vms[msg.vmId].detachAll();
                    delete vms[msg.vmId];
                    manager.shutdown(msg.vmId);
                },
                power : function () { manager.power(msg.vmId, client.send) },
                attach : function () {
                    vm.attach(client);
                    vm.requestRedrawScreen();
                },
                detach : function () {
                    vm.detach(client);
                },
                keyDown : function () {
                    vm.keyDown(parseInt(msg.key, 10));
                },
                keyUp : function () {
                    vm.keyUp(parseInt(msg.key, 10));
                },
                pointer : function () {
                    vm.sendPointer(parseInt(msg.x, 10), parseInt(msg.y, 10),
                        parseInt(msg.mask, 10));
                },
                redrawScreen : function () {
                    vm.requestRedrawScreen();
                }
            }[msg.action];
            if (f) f();
        }
    });
});

