

window.pubsub = (function() {
    "use strict";

    var bus = new Bacon.Bus();

    var stream = function(requestedNamespace) {
        var correctNamespace = function(event) {
            return requestedNamespace === "*" || event.namespace === requestedNamespace;
        };

        return bus.filter(correctNamespace).map(".data");
    };

    // Dead simple pubsub event-bus with reactive
    // capabilities provided by Bacon.js
    return {
        broadcast: function() {
            if (arguments.length === 1) {
                bus.push(arguments[0]);
            }
            else if (arguments.length === 2) {
                bus.push({
                    namespace: arguments[0],
                    data: arguments[1]
                });
            }
            else {
                throw "Don't know what to do with this"
            }
        },

        takeOne: function(type) {
            return stream(type).take(1);
        },

        stream: stream
    }
})();

pubsub.stream("*").log("Bus activity");




/**
 * Define some useful global streams and properties
 */
var globalBacon = (function() {
    var websocketConnecting = pubsub.stream("websocket-connecting");
    var websocketConnectionFailed = pubsub.stream("websocket-connection-failed");
    var websocketOpened = pubsub.stream("websocket-opened");
    var websocketClosed = pubsub.stream("websocket-closed");

    return {
        isWebsocketOpen : websocketOpened.map(true)
                .merge(websocketClosed.map(false))
                .toProperty(false),

        isWebsocketConnecting : websocketConnecting.map(true)
                .merge(websocketConnectionFailed.map(false))
                .merge(websocketOpened.map(false))
                .merge(websocketClosed.map(false))
                .toProperty(false),

        backendConnectionRestored: pubsub.stream("connectionRestored"),
        backendConnectionLost: pubsub.stream("connectionLost")
    };
})();



(function() {
    if (window.WebSocket) {
        var createSocket = function(uri) {
            console.info("Connecting to.. " + uri);
            var socket;

            try {
                pubsub.broadcast("websocket-connecting", uri);
                socket = new WebSocket(uri);
            }
            catch (err) {
                pubsub.broadcast("websocket-connection-failed", uri);
            }

            socket.onmessage = function (event) {
                var json = JSON.parse(event.data);

                pubsub.broadcast({
                    namespace: json.namespace,
                    data: json.payload
                });
            };

            socket.onerror = function(event) {
                pubsub.broadcast({
                    namespace: "websocket-error",
                    data: event
                });
            };

            socket.onopen = function (event) {
                pubsub.broadcast({
                    namespace: "websocket-opened",
                    data: event
                });
            };

            socket.onclose = function (event) {
                pubsub.broadcast({
                    namespace: "websocket-closed",
                    data: event
                });
            };
        };


        Bacon.once()
            .merge(Bacon.interval(5000))
            .filter(globalBacon.isWebsocketOpen.not())
            .filter(globalBacon.isWebsocketConnecting.not())
            .assign(createSocket, "ws://localhost:9000");
    }
    else {
        alert("Your browser does not support Websockets");
    }
})();

