function timeoutdo() {
	self.postMessage("");
}
self.onmessage = function(event) {
	setTimeout(timeoutdo, event.data);
};
