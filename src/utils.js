
/**
 * A singleton class for dispatching delayed function calls.
 */
var CallLaterDispatcher = (function() {
	var instance = null;

	function PrivateConstructor() {
		var callLaterFuncs = [];
		var callLaterTimeoutId = null;
		
		/**
		 * Queues the given function to be called later.
		 * @param {Object} context The 'this' object for the call.
		 * @param {Object} func The function to call.
		 * @param {Object} args Array of arguments to pass to the function.
		 */
		this.callLater = function(context, func, args) {
			callLaterFuncs.push({
				context: context ? context : {},
				func: func,
				args: args ? args : []
			});
			
			if (callLaterTimeoutId == null) {
				callLaterTimeoutId = setTimeout(
					'CallLaterDispatcher.getInstance().callLaterDispatcher()', 50);
			}
		};
		
		/**
		 * Calls the functions in the call later queue.
		 * @private Internal use only.
		 */
		this.callLaterDispatcher = function() {
			for (var i = 0; i < callLaterFuncs.length; i++) {
				var o = callLaterFuncs[i];
				o.func.apply(o.context, o.args);
			}
			
			callLaterFuncs = [];
			callLaterTimeoutId = null;
		};
	}

	/**
	 * Fetches a singleton instance.
	 */
	return new function() {
		this.getInstance = function() {
			if (instance == null) {
				instance = new PrivateConstructor();
				instance.constructor = null;
			}
			return instance;
		};
	};
})();


