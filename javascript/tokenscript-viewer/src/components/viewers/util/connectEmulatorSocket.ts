
export function connectEmulatorSocket(host: string, buildUpdatedCallback: () => void|Promise<void>){

	try {
		const webSocket = new WebSocket("ws://" + new URL(host).host + "/ws");

		webSocket.onopen = (event) => {
			console.log("connected: ", event.type);
			webSocket.send("Websocket client connected!");
		};

		webSocket.onmessage = async (event) => {

			if (event.data != "BUILD_UPDATED")
				return;

			// TODO: Implement build started and build error events
			try {
				await buildUpdatedCallback();
			} catch (e){
				console.error(e);
				alert("Failed to reload TokenScript changes");
			}
		}
	} catch (e){
		console.error(e);
	}
}
