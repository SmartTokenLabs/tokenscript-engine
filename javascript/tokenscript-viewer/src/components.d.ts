/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { TokenScript } from "../../engine-js/src/TokenScript";
import { TokenScriptSource } from "./components/app/app";
import { IntegrationViewer } from "./components/viewers/integration/integration-viewer";
import { TokenScript as TokenScript1 } from "@tokenscript/engine-js/src/TokenScript";
import { AppRoot, TokenScriptSource as TokenScriptSource1 } from "./components/app/app";
import { Card } from "@tokenscript/engine-js/src/tokenScript/Card";
import { TabbedViewer } from "./components/viewers/tabbed/tabbed-viewer";
import { TokenGridContext } from "./components/viewers/util/getTokensFlat";
import { JSX } from "@stencil/core";
import { SupportedWalletProviders } from "./components/wallet/Web3WalletProvider";
export namespace Components {
    interface AddSelector {
        "openTokenScript": () => Promise<void>;
    }
    interface AppRoot {
        "loadTokenscript": (source: TokenScriptSource, tsId?: string) => Promise<TokenScript>;
    }
    interface AttributeTable {
    }
    interface ConfirmStep {
        "tokenScript": TokenScript1;
        "viewer": IntegrationViewer;
    }
    interface DebugViewerTab {
        "app": AppRoot;
        "tabId": string;
        "tokenScript": TokenScript;
    }
    interface IntegrationViewer {
        "app": AppRoot;
    }
    interface LoadingSpinner {
        "color": string;
        "size": string;
    }
    interface NewViewer {
        "app": AppRoot;
    }
    interface PopoverDialog {
        "closeDialog": () => Promise<void>;
        "openDialog": (dismissCallback?: () => {}) => Promise<void>;
    }
    interface SecurityStatus {
        "tokenScript": TokenScript1;
    }
    interface SelectStep {
        "card": Card;
        "tokenScript": TokenScript1;
        "viewer": IntegrationViewer;
    }
    interface StartTab {
        "tabId": string;
        "tabView": TabbedViewer;
    }
    interface TabHeaderItem {
        "closable": boolean;
        "tabId": string;
        "tabTitle": string;
        "tabView": TabbedViewer;
    }
    interface TabbedViewer {
        "app": AppRoot;
        "closeTab": (id: string) => Promise<void>;
        "openTokenScriptTab": (source: TokenScriptSource1, tsId?: string, emulator?: string) => Promise<void>;
        "showTab": (id: string) => Promise<void>;
    }
    interface TokenButton {
        "buttonTitle": string;
        "clickHandler": (token: TokenGridContext) => void;
        "enabled": boolean;
        "token": TokenGridContext;
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
    interface TokenscriptButton {
        "enabled": boolean;
        "imageUrl": string;
        "name": string;
        "tokenScript"?: TokenScript1;
    }
    interface TokenscriptGrid {
    }
    interface ViewStep {
        "card": Card;
        "tokenScript": TokenScript1;
        "viewer": IntegrationViewer;
    }
    interface ViewerTab {
        "app": AppRoot;
        "tabId": string;
        "tokenScript": TokenScript;
    }
    interface WalletButton {
    }
    interface WalletSelector {
        "connectWallet": () => Promise<SupportedWalletProviders>;
    }
}
declare global {
    interface HTMLAddSelectorElement extends Components.AddSelector, HTMLStencilElement {
    }
    var HTMLAddSelectorElement: {
        prototype: HTMLAddSelectorElement;
        new (): HTMLAddSelectorElement;
    };
    interface HTMLAppRootElement extends Components.AppRoot, HTMLStencilElement {
    }
    var HTMLAppRootElement: {
        prototype: HTMLAppRootElement;
        new (): HTMLAppRootElement;
    };
    interface HTMLAttributeTableElement extends Components.AttributeTable, HTMLStencilElement {
    }
    var HTMLAttributeTableElement: {
        prototype: HTMLAttributeTableElement;
        new (): HTMLAttributeTableElement;
    };
    interface HTMLConfirmStepElement extends Components.ConfirmStep, HTMLStencilElement {
    }
    var HTMLConfirmStepElement: {
        prototype: HTMLConfirmStepElement;
        new (): HTMLConfirmStepElement;
    };
    interface HTMLDebugViewerTabElement extends Components.DebugViewerTab, HTMLStencilElement {
    }
    var HTMLDebugViewerTabElement: {
        prototype: HTMLDebugViewerTabElement;
        new (): HTMLDebugViewerTabElement;
    };
    interface HTMLIntegrationViewerElement extends Components.IntegrationViewer, HTMLStencilElement {
    }
    var HTMLIntegrationViewerElement: {
        prototype: HTMLIntegrationViewerElement;
        new (): HTMLIntegrationViewerElement;
    };
    interface HTMLLoadingSpinnerElement extends Components.LoadingSpinner, HTMLStencilElement {
    }
    var HTMLLoadingSpinnerElement: {
        prototype: HTMLLoadingSpinnerElement;
        new (): HTMLLoadingSpinnerElement;
    };
    interface HTMLNewViewerElement extends Components.NewViewer, HTMLStencilElement {
    }
    var HTMLNewViewerElement: {
        prototype: HTMLNewViewerElement;
        new (): HTMLNewViewerElement;
    };
    interface HTMLPopoverDialogElement extends Components.PopoverDialog, HTMLStencilElement {
    }
    var HTMLPopoverDialogElement: {
        prototype: HTMLPopoverDialogElement;
        new (): HTMLPopoverDialogElement;
    };
    interface HTMLSecurityStatusElement extends Components.SecurityStatus, HTMLStencilElement {
    }
    var HTMLSecurityStatusElement: {
        prototype: HTMLSecurityStatusElement;
        new (): HTMLSecurityStatusElement;
    };
    interface HTMLSelectStepElement extends Components.SelectStep, HTMLStencilElement {
    }
    var HTMLSelectStepElement: {
        prototype: HTMLSelectStepElement;
        new (): HTMLSelectStepElement;
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
    interface HTMLTabbedViewerElement extends Components.TabbedViewer, HTMLStencilElement {
    }
    var HTMLTabbedViewerElement: {
        prototype: HTMLTabbedViewerElement;
        new (): HTMLTabbedViewerElement;
    };
    interface HTMLTokenButtonElement extends Components.TokenButton, HTMLStencilElement {
    }
    var HTMLTokenButtonElement: {
        prototype: HTMLTokenButtonElement;
        new (): HTMLTokenButtonElement;
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
    interface HTMLTokenscriptButtonElement extends Components.TokenscriptButton, HTMLStencilElement {
    }
    var HTMLTokenscriptButtonElement: {
        prototype: HTMLTokenscriptButtonElement;
        new (): HTMLTokenscriptButtonElement;
    };
    interface HTMLTokenscriptGridElement extends Components.TokenscriptGrid, HTMLStencilElement {
    }
    var HTMLTokenscriptGridElement: {
        prototype: HTMLTokenscriptGridElement;
        new (): HTMLTokenscriptGridElement;
    };
    interface HTMLViewStepElement extends Components.ViewStep, HTMLStencilElement {
    }
    var HTMLViewStepElement: {
        prototype: HTMLViewStepElement;
        new (): HTMLViewStepElement;
    };
    interface HTMLViewerTabElement extends Components.ViewerTab, HTMLStencilElement {
    }
    var HTMLViewerTabElement: {
        prototype: HTMLViewerTabElement;
        new (): HTMLViewerTabElement;
    };
    interface HTMLWalletButtonElement extends Components.WalletButton, HTMLStencilElement {
    }
    var HTMLWalletButtonElement: {
        prototype: HTMLWalletButtonElement;
        new (): HTMLWalletButtonElement;
    };
    interface HTMLWalletSelectorElement extends Components.WalletSelector, HTMLStencilElement {
    }
    var HTMLWalletSelectorElement: {
        prototype: HTMLWalletSelectorElement;
        new (): HTMLWalletSelectorElement;
    };
    interface HTMLElementTagNameMap {
        "add-selector": HTMLAddSelectorElement;
        "app-root": HTMLAppRootElement;
        "attribute-table": HTMLAttributeTableElement;
        "confirm-step": HTMLConfirmStepElement;
        "debug-viewer-tab": HTMLDebugViewerTabElement;
        "integration-viewer": HTMLIntegrationViewerElement;
        "loading-spinner": HTMLLoadingSpinnerElement;
        "new-viewer": HTMLNewViewerElement;
        "popover-dialog": HTMLPopoverDialogElement;
        "security-status": HTMLSecurityStatusElement;
        "select-step": HTMLSelectStepElement;
        "start-tab": HTMLStartTabElement;
        "tab-header-item": HTMLTabHeaderItemElement;
        "tabbed-viewer": HTMLTabbedViewerElement;
        "token-button": HTMLTokenButtonElement;
        "token-icon": HTMLTokenIconElement;
        "tokens-grid": HTMLTokensGridElement;
        "tokens-grid-item": HTMLTokensGridItemElement;
        "tokenscript-button": HTMLTokenscriptButtonElement;
        "tokenscript-grid": HTMLTokenscriptGridElement;
        "view-step": HTMLViewStepElement;
        "viewer-tab": HTMLViewerTabElement;
        "wallet-button": HTMLWalletButtonElement;
        "wallet-selector": HTMLWalletSelectorElement;
    }
}
declare namespace LocalJSX {
    interface AddSelector {
    }
    interface AppRoot {
    }
    interface AttributeTable {
    }
    interface ConfirmStep {
        "tokenScript"?: TokenScript1;
        "viewer"?: IntegrationViewer;
    }
    interface DebugViewerTab {
        "app"?: AppRoot;
        "tabId"?: string;
        "tokenScript"?: TokenScript;
    }
    interface IntegrationViewer {
        "app"?: AppRoot;
    }
    interface LoadingSpinner {
        "color"?: string;
        "size"?: string;
    }
    interface NewViewer {
        "app"?: AppRoot;
    }
    interface PopoverDialog {
    }
    interface SecurityStatus {
        "tokenScript"?: TokenScript1;
    }
    interface SelectStep {
        "card"?: Card;
        "tokenScript"?: TokenScript1;
        "viewer"?: IntegrationViewer;
    }
    interface StartTab {
        "tabId"?: string;
        "tabView"?: TabbedViewer;
    }
    interface TabHeaderItem {
        "closable"?: boolean;
        "tabId"?: string;
        "tabTitle"?: string;
        "tabView"?: TabbedViewer;
    }
    interface TabbedViewer {
        "app"?: AppRoot;
    }
    interface TokenButton {
        "buttonTitle"?: string;
        "clickHandler"?: (token: TokenGridContext) => void;
        "enabled"?: boolean;
        "token"?: TokenGridContext;
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
    interface TokenscriptButton {
        "enabled"?: boolean;
        "imageUrl"?: string;
        "name"?: string;
        "tokenScript"?: TokenScript1;
    }
    interface TokenscriptGrid {
    }
    interface ViewStep {
        "card"?: Card;
        "tokenScript"?: TokenScript1;
        "viewer"?: IntegrationViewer;
    }
    interface ViewerTab {
        "app"?: AppRoot;
        "tabId"?: string;
        "tokenScript"?: TokenScript;
    }
    interface WalletButton {
    }
    interface WalletSelector {
    }
    interface IntrinsicElements {
        "add-selector": AddSelector;
        "app-root": AppRoot;
        "attribute-table": AttributeTable;
        "confirm-step": ConfirmStep;
        "debug-viewer-tab": DebugViewerTab;
        "integration-viewer": IntegrationViewer;
        "loading-spinner": LoadingSpinner;
        "new-viewer": NewViewer;
        "popover-dialog": PopoverDialog;
        "security-status": SecurityStatus;
        "select-step": SelectStep;
        "start-tab": StartTab;
        "tab-header-item": TabHeaderItem;
        "tabbed-viewer": TabbedViewer;
        "token-button": TokenButton;
        "token-icon": TokenIcon;
        "tokens-grid": TokensGrid;
        "tokens-grid-item": TokensGridItem;
        "tokenscript-button": TokenscriptButton;
        "tokenscript-grid": TokenscriptGrid;
        "view-step": ViewStep;
        "viewer-tab": ViewerTab;
        "wallet-button": WalletButton;
        "wallet-selector": WalletSelector;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "add-selector": LocalJSX.AddSelector & JSXBase.HTMLAttributes<HTMLAddSelectorElement>;
            "app-root": LocalJSX.AppRoot & JSXBase.HTMLAttributes<HTMLAppRootElement>;
            "attribute-table": LocalJSX.AttributeTable & JSXBase.HTMLAttributes<HTMLAttributeTableElement>;
            "confirm-step": LocalJSX.ConfirmStep & JSXBase.HTMLAttributes<HTMLConfirmStepElement>;
            "debug-viewer-tab": LocalJSX.DebugViewerTab & JSXBase.HTMLAttributes<HTMLDebugViewerTabElement>;
            "integration-viewer": LocalJSX.IntegrationViewer & JSXBase.HTMLAttributes<HTMLIntegrationViewerElement>;
            "loading-spinner": LocalJSX.LoadingSpinner & JSXBase.HTMLAttributes<HTMLLoadingSpinnerElement>;
            "new-viewer": LocalJSX.NewViewer & JSXBase.HTMLAttributes<HTMLNewViewerElement>;
            "popover-dialog": LocalJSX.PopoverDialog & JSXBase.HTMLAttributes<HTMLPopoverDialogElement>;
            "security-status": LocalJSX.SecurityStatus & JSXBase.HTMLAttributes<HTMLSecurityStatusElement>;
            "select-step": LocalJSX.SelectStep & JSXBase.HTMLAttributes<HTMLSelectStepElement>;
            "start-tab": LocalJSX.StartTab & JSXBase.HTMLAttributes<HTMLStartTabElement>;
            "tab-header-item": LocalJSX.TabHeaderItem & JSXBase.HTMLAttributes<HTMLTabHeaderItemElement>;
            "tabbed-viewer": LocalJSX.TabbedViewer & JSXBase.HTMLAttributes<HTMLTabbedViewerElement>;
            "token-button": LocalJSX.TokenButton & JSXBase.HTMLAttributes<HTMLTokenButtonElement>;
            "token-icon": LocalJSX.TokenIcon & JSXBase.HTMLAttributes<HTMLTokenIconElement>;
            "tokens-grid": LocalJSX.TokensGrid & JSXBase.HTMLAttributes<HTMLTokensGridElement>;
            "tokens-grid-item": LocalJSX.TokensGridItem & JSXBase.HTMLAttributes<HTMLTokensGridItemElement>;
            "tokenscript-button": LocalJSX.TokenscriptButton & JSXBase.HTMLAttributes<HTMLTokenscriptButtonElement>;
            "tokenscript-grid": LocalJSX.TokenscriptGrid & JSXBase.HTMLAttributes<HTMLTokenscriptGridElement>;
            "view-step": LocalJSX.ViewStep & JSXBase.HTMLAttributes<HTMLViewStepElement>;
            "viewer-tab": LocalJSX.ViewerTab & JSXBase.HTMLAttributes<HTMLViewerTabElement>;
            "wallet-button": LocalJSX.WalletButton & JSXBase.HTMLAttributes<HTMLWalletButtonElement>;
            "wallet-selector": LocalJSX.WalletSelector & JSXBase.HTMLAttributes<HTMLWalletSelectorElement>;
        }
    }
}
