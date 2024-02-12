
export interface ILocalStorageAdapter {
	getAllItems(tsId: string): Promise<{[key: string]: string}>;
	setItem(tsId: string, key: string, value: string): void;
	removeItem(tsId: string, key: string): void;
	clear(tsId: string): void;
}
