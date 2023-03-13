/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { TokenScript } from "../../engine-js/src/TokenScript";
import { TokenScriptSource } from "./components/app/app";
import { TokenScript as TokenScript1 } from "@tokenscript/engine-js/src/TokenScript";
import { JSX } from "@stencil/core";
import { TokenGridContext } from "./components/viewer/tokens-grid";
import { Card } from "@tokenscript/engine-js/src/tokenScript/Card";
export namespace Components {
    interface AppRoot {
        "closeTab": (id: string) => Promise<void>;
        "loadTokenscript": (source: TokenScriptSource, tsId?: string) => Promise<TokenScript>;
        "openTokenScriptTab": (source: TokenScriptSource, tsId?: string, emulator?: string) => Promise<void>;
        "showTab": (id: string) => Promise<void>;
    }
    interface DebugViewerTab {
        "app": AppRoot;
        "tabId": string;
        "tokenScript": TokenScript;
    }
    interface LoadingSpinner {
        "color": string;
        "size": string;
    }
    interface SecurityStatus {
        "tokenScript": TokenScript1;
    }
    interface StartTab {
        "app": AppRoot;
        "tabId": string;
    }
    interface TabHeaderItem {
        "app": AppRoot;
        "closable": boolean;
        "tabId": string;
        "tabTitle": string;
    }
    interface TokenIcon {
        "imageTitle": string;
        "src": string;
    }
    interface TokensGrid {
        "showToast": (type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element) => void;
        "tokenScript": TokenScript1;
    }
    interface TokensGridItem {
        "showCard": (card: Card, token: TokenGridContext, index: number) => void;
        "token": TokenGridContext;
        "tokenScript": TokenScript1;
    }
    interface ViewerTab {
        "app": AppRoot;
        "tabId": string;
        "tokenScript": TokenScript;
    }
}
declare global {
    interface HTMLAppRootElement extends Components.AppRoot, HTMLStencilElement {
    }
    var HTMLAppRootElement: {
        prototype: HTMLAppRootElement;
        new (): HTMLAppRootElement;
    };
    interface HTMLDebugViewerTabElement extends Components.DebugViewerTab, HTMLStencilElement {
    }
    var HTMLDebugViewerTabElement: {
        prototype: HTMLDebugViewerTabElement;
        new (): HTMLDebugViewerTabElement;
    };
    interface HTMLLoadingSpinnerElement extends Components.LoadingSpinner, HTMLStencilElement {
    }
    var HTMLLoadingSpinnerElement: {
        prototype: HTMLLoadingSpinnerElement;
        new (): HTMLLoadingSpinnerElement;
    };
    interface HTMLSecurityStatusElement extends Components.SecurityStatus, HTMLStencilElement {
    }
    var HTMLSecurityStatusElement: {
        prototype: HTMLSecurityStatusElement;
        new (): HTMLSecurityStatusElement;
    };
    interface HTMLStartTabElement extends Components.StartTab, HTMLStencilElement {
    }
    var HTMLStartTabElement: {
        prototype: HTMLStartTabElement;
        new (): HTMLStartTabElement;
    };
    interface HTMLTabHeaderItemElement extends Components.TabHeaderItem, HTMLStencilElement {
    }
    var HTMLTabHeaderItemElement: {
        prototype: HTMLTabHeaderItemElement;
        new (): HTMLTabHeaderItemElement;
    };
    interface HTMLTokenIconElement extends Components.TokenIcon, HTMLStencilElement {
    }
    var HTMLTokenIconElement: {
        prototype: HTMLTokenIconElement;
        new (): HTMLTokenIconElement;
    };
    interface HTMLTokensGridElement extends Components.TokensGrid, HTMLStencilElement {
    }
    var HTMLTokensGridElement: {
        prototype: HTMLTokensGridElement;
        new (): HTMLTokensGridElement;
    };
    interface HTMLTokensGridItemElement extends Components.TokensGridItem, HTMLStencilElement {
    }
    var HTMLTokensGridItemElement: {
        prototype: HTMLTokensGridItemElement;
        new (): HTMLTokensGridItemElement;
    };
    interface HTMLViewerTabElement extends Components.ViewerTab, HTMLStencilElement {
    }
    var HTMLViewerTabElement: {
        prototype: HTMLViewerTabElement;
        new (): HTMLViewerTabElement;
    };
    interface HTMLElementTagNameMap {
        "app-root": HTMLAppRootElement;
        "debug-viewer-tab": HTMLDebugViewerTabElement;
        "loading-spinner": HTMLLoadingSpinnerElement;
        "security-status": HTMLSecurityStatusElement;
        "start-tab": HTMLStartTabElement;
        "tab-header-item": HTMLTabHeaderItemElement;
        "token-icon": HTMLTokenIconElement;
        "tokens-grid": HTMLTokensGridElement;
        "tokens-grid-item": HTMLTokensGridItemElement;
        "viewer-tab": HTMLViewerTabElement;
    }
}
declare namespace LocalJSX {
    interface AppRoot {
    }
    interface DebugViewerTab {
        "app"?: AppRoot;
        "tabId"?: string;
        "tokenScript"?: TokenScript;
    }
    interface LoadingSpinner {
        "color"?: string;
        "size"?: string;
    }
    interface SecurityStatus {
        "tokenScript"?: TokenScript1;
    }
    interface StartTab {
        "app"?: AppRoot;
        "tabId"?: string;
    }
    interface TabHeaderItem {
        "app"?: AppRoot;
        "closable"?: boolean;
        "tabId"?: string;
        "tabTitle"?: string;
    }
    interface TokenIcon {
        "imageTitle"?: string;
        "src"?: string;
    }
    interface TokensGrid {
        "showToast"?: (type: 'success'|'info'|'warning'|'error', title: string, description: string|JSX.Element) => void;
        "tokenScript"?: TokenScript1;
    }
    interface TokensGridItem {
        "showCard"?: (card: Card, token: TokenGridContext, index: number) => void;
        "token"?: TokenGridContext;
        "tokenScript"?: TokenScript1;
    }
    interface ViewerTab {
        "app"?: AppRoot;
        "tabId"?: string;
        "tokenScript"?: TokenScript;
    }
    interface IntrinsicElements {
        "app-root": AppRoot;
        "debug-viewer-tab": DebugViewerTab;
        "loading-spinner": LoadingSpinner;
        "security-status": SecurityStatus;
        "start-tab": StartTab;
        "tab-header-item": TabHeaderItem;
        "token-icon": TokenIcon;
        "tokens-grid": TokensGrid;
        "tokens-grid-item": TokensGridItem;
        "viewer-tab": ViewerTab;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "app-root": LocalJSX.AppRoot & JSXBase.HTMLAttributes<HTMLAppRootElement>;
            "debug-viewer-tab": LocalJSX.DebugViewerTab & JSXBase.HTMLAttributes<HTMLDebugViewerTabElement>;
            "loading-spinner": LocalJSX.LoadingSpinner & JSXBase.HTMLAttributes<HTMLLoadingSpinnerElement>;
            "security-status": LocalJSX.SecurityStatus & JSXBase.HTMLAttributes<HTMLSecurityStatusElement>;
            "start-tab": LocalJSX.StartTab & JSXBase.HTMLAttributes<HTMLStartTabElement>;
            "tab-header-item": LocalJSX.TabHeaderItem & JSXBase.HTMLAttributes<HTMLTabHeaderItemElement>;
            "token-icon": LocalJSX.TokenIcon & JSXBase.HTMLAttributes<HTMLTokenIconElement>;
            "tokens-grid": LocalJSX.TokensGrid & JSXBase.HTMLAttributes<HTMLTokensGridElement>;
            "tokens-grid-item": LocalJSX.TokensGridItem & JSXBase.HTMLAttributes<HTMLTokensGridItemElement>;
            "viewer-tab": LocalJSX.ViewerTab & JSXBase.HTMLAttributes<HTMLViewerTabElement>;
        }
    }
}
