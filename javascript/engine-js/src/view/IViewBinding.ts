import {Card} from "../tokenScript/Card";
import {RequestFromView, ViewEvent} from "./ViewController";
import {RpcResponse} from "../wallet/IWalletAdapter";

/**
 * IViewBinding is the interface the user-agent implements to provide a UI adapter than the engine uses to display TS cards
 */
export interface IViewBinding {
	/**
	 * Render the HTML (or URL) associated with the view
	 * @param card
	 * @param tsId
	 */
	showTokenView(card: Card, tsId?: string): Promise<void>|void
	/**
	 * Unload the current card from the token view
	 */
	unloadTokenView(): Promise<void>|void
	/**
	 * Dispatch an event
	 * @param event
	 * @param data
	 * @param id
	 */
	dispatchViewEvent(event: ViewEvent, data: any, id: string|null): Promise<void>|void
	/**
	 * Dispatch an event
	 * @param response RpcResponse
	 */
	dispatchRpcResult(response: RpcResponse): Promise<void>|void
	/**
	 * Handle an engine request from the view
	 * @param event
	 * @param data
	 */
	handleMessageFromView(event: RequestFromView, data: any);
	/**
	 * Inject platform specific Javascript code to interact with the engine from the TokenScript view
	 */
	getViewBindingJavascript(): string
	/**
	 * Indicates that a new card has been set and the view is preparing to be loaded
	 */
	viewLoading(): Promise<void>|void
	/**
	 * Indicate that an error has occurred while loading the view
	 */
	viewError(error: Error): Promise<void>|void
	/**
	 * Show or hide loader
	 */
	showLoader(show?: boolean): Promise<void>|void
}
