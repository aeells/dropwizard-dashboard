/**
 * Trigger heartbeat when any message is received
 */
(function() {
    var $heart = $("#heart");

    pubsub.stream("*").onValue(function() {
        $heart.fadeTo(100, 0.4, function () {
            $heart.fadeTo(300, 0.2);
        });
    });
})();


/**
 * Fade screen when the connection to Dropwizard goes away
 */
(function() {
    var body = $("body");

    pubsub.stream("connectionLost").onValue(function() {
        body.fadeTo(500, 0.5);
    });

    pubsub.stream("connectionRestored").onValue(function() {
        body.fadeTo(500, 1.0);
    });
})();


/**
 * Display warning about websocket connection
 */
(function() {
    var $warning = $("#websocketConnectionWarning");
    wsBacon.isWebsocketOpen.assign($warning, "toggleClass", "hidden");
})();