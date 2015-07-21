

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
        broadcast: function(event) {
            bus.push(event);
        },

        takeOne: function(type) {
            return stream(type).take(1);
        },

        stream: stream
    }
})();

pubsub.stream("*").log("Bus activity");



(function() {
    if (window.WebSocket) {
        var socket = new WebSocket("ws://localhost:9000");

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
    }
    else {
        alert("Your browser does not support Websockets");
    }
})();



