/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { TokenScriptEngine } from "../../engine-js/src/Engine";
import { ITokenDetail } from "../../engine-js/src/tokens/ITokenDetail";
import { TokenScript } from "../../engine-js/src/TokenScript";
import { AppRoot, ShowToastEventArgs, TokenScriptSource } from "./components/app/app";
import { TokenScriptSource as TokenScriptSource1 } from "./components/app/app";
import { JSX } from "@stencil/core";
import { TokenScript as TokenScript1 } from "@tokenscript/engine-js/src/TokenScript";
import { IntegrationViewer } from "./components/viewers/integration/integration-viewer";
import { Card } from "@tokenscript/engine-js/src/tokenScript/Card";
import { TabbedViewer } from "./components/viewers/tabbed/tabbed-viewer";
import { TokenGridContext } from "./components/viewers/util/getTokensFlat";
import { SupportedWalletProviders } from "./components/wallet/Web3WalletProvider";
export namespace Components {
    interface AboutTokenscript {
    }
    interface ActionBar {
        "actionsEnabled"?: boolean;
        "engine": TokenScriptEngine;
        "tokenDetails"?: ITokenDetail;
        "tokenScript"?: TokenScript;
    }
    interface ActionOverflowModal {
        "closeDialog": () => Promise<void>;
        "openDialog": () => Promise<void>;
    }
    interface AddSelector {
        "closeDialog": () => Promise<void>;
        "onFormSubmit": (type: TokenScriptSource, data: {tsId?: string, xml?: File}) => Promise<void>;
        "openDialog": () => Promise<void>;
    }
    interface AlphawalletViewer {
        "app": AppRoot;
    }
    interface AppRoot {
        "loadTokenscript": (source: TokenScriptSource, tsId?: string, file?: File | string) => Promise<TokenScript>;
        "showToast": (type: 'success' | 'info' | 'warning' | 'error', title: string, description: string | JSX.Element) => Promise<void>;
    }
    interface AttributeTable {
    }
    interface CardModal {
        "tokenScript"?: TokenScript1;
    }
    interface CardPopover {
        "tokenScript": TokenScript;
    }
    interface CardView {
    }
    interface ConfirmStep {
        "tokenScript": TokenScript1;
        "viewer": IntegrationViewer;
    }
    interface InputField {
        "getFile": () => Promise<File>;
        "label": string;
        "name": string;
        "pattern"?: string;
        "required": boolean;
        "type": string;
        "value": any;
    }
    interface IntegrationViewer {
        "app": AppRoot;
    }
    interface LoadingSpinner {
        "color": string;
        "size": "large"|"small";
    }
    interface NewViewer {
        "app": AppRoot;
    }
    interface OpenseaViewer {
        "app": AppRoot;
    }
    interface PopoverDialog {
        "closeDialog": () => Promise<void>;
        "dialogStyles": {[cssProp: string]: string};
        "openDialog": (dismissCallback?: () => void | Promise<void>) => Promise<void>;
    }
    interface SecurityStatus {
        "size": "large"|"small";
        "tokenScript": TokenScript1;
    }
    interface SelectField {
        "label": string;
        "name": string;
        "options": {label: string, value: string}[];
        "value": string;
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
    interface StsViewer {
        "app": AppRoot;
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
        "openTokenScriptTab": (source: TokenScriptSource, tsId?: string, file?: File, emulator?: string) => Promise<void>;
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
    interface TokenInfoPopover {
        "closeDialog": () => Promise<void>;
        "openDialog": (token: TokenGridContext) => Promise<void>;
        "tokenScript": TokenScript;
    }
    interface TokenSecurityStatus {
        "originId": string;
        "tokenScript": TokenScript1;
    }
    interface TokenViewer {
        "app": AppRoot;
    }
    interface TokensGrid {
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
        "onRemove"?: (tsId: string) => Promise<void>;
        "tokenScript"?: TokenScript1;
        "tsId": string;
    }
    interface TokenscriptGrid {
    }
    interface TransferDialog {
        "closeDialog": () => Promise<void>;
        "engine": TokenScriptEngine;
        "openDialog": () => Promise<void>;
        "tokenDetails": ITokenDetail;
    }
    interface ViewStep {
        "card": Card;
        "tokenScript": TokenScript1;
        "viewer": IntegrationViewer;
    }
    interface ViewerPopover {
        "close": () => Promise<void>;
        "open": (tokenScript: TokenScript1) => Promise<void>;
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
export interface ActionBarCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLActionBarElement;
}
export interface AlphawalletViewerCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLAlphawalletViewerElement;
}
export interface CardModalCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLCardModalElement;
}
export interface CardPopoverCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLCardPopoverElement;
}
export interface NewViewerCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLNewViewerElement;
}
export interface OpenseaViewerCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLOpenseaViewerElement;
}
export interface StsViewerCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLStsViewerElement;
}
export interface TokenViewerCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLTokenViewerElement;
}
export interface TokensGridCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLTokensGridElement;
}
export interface TransferDialogCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLTransferDialogElement;
}
export interface ViewStepCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLViewStepElement;
}
export interface ViewerTabCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLViewerTabElement;
}
declare global {
    interface HTMLAboutTokenscriptElement extends Components.AboutTokenscript, HTMLStencilElement {
    }
    var HTMLAboutTokenscriptElement: {
        prototype: HTMLAboutTokenscriptElement;
        new (): HTMLAboutTokenscriptElement;
    };
    interface HTMLActionBarElement extends Components.ActionBar, HTMLStencilElement {
    }
    var HTMLActionBarElement: {
        prototype: HTMLActionBarElement;
        new (): HTMLActionBarElement;
    };
    interface HTMLActionOverflowModalElement extends Components.ActionOverflowModal, HTMLStencilElement {
    }
    var HTMLActionOverflowModalElement: {
        prototype: HTMLActionOverflowModalElement;
        new (): HTMLActionOverflowModalElement;
    };
    interface HTMLAddSelectorElement extends Components.AddSelector, HTMLStencilElement {
    }
    var HTMLAddSelectorElement: {
        prototype: HTMLAddSelectorElement;
        new (): HTMLAddSelectorElement;
    };
    interface HTMLAlphawalletViewerElement extends Components.AlphawalletViewer, HTMLStencilElement {
    }
    var HTMLAlphawalletViewerElement: {
        prototype: HTMLAlphawalletViewerElement;
        new (): HTMLAlphawalletViewerElement;
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
    interface HTMLCardModalElement extends Components.CardModal, HTMLStencilElement {
    }
    var HTMLCardModalElement: {
        prototype: HTMLCardModalElement;
        new (): HTMLCardModalElement;
    };
    interface HTMLCardPopoverElement extends Components.CardPopover, HTMLStencilElement {
    }
    var HTMLCardPopoverElement: {
        prototype: HTMLCardPopoverElement;
        new (): HTMLCardPopoverElement;
    };
    interface HTMLCardViewElement extends Components.CardView, HTMLStencilElement {
    }
    var HTMLCardViewElement: {
        prototype: HTMLCardViewElement;
        new (): HTMLCardViewElement;
    };
    interface HTMLConfirmStepElement extends Components.ConfirmStep, HTMLStencilElement {
    }
    var HTMLConfirmStepElement: {
        prototype: HTMLConfirmStepElement;
        new (): HTMLConfirmStepElement;
    };
    interface HTMLInputFieldElement extends Components.InputField, HTMLStencilElement {
    }
    var HTMLInputFieldElement: {
        prototype: HTMLInputFieldElement;
        new (): HTMLInputFieldElement;
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
    interface HTMLOpenseaViewerElement extends Components.OpenseaViewer, HTMLStencilElement {
    }
    var HTMLOpenseaViewerElement: {
        prototype: HTMLOpenseaViewerElement;
        new (): HTMLOpenseaViewerElement;
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
    interface HTMLSelectFieldElement extends Components.SelectField, HTMLStencilElement {
    }
    var HTMLSelectFieldElement: {
        prototype: HTMLSelectFieldElement;
        new (): HTMLSelectFieldElement;
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
    interface HTMLStsViewerElement extends Components.StsViewer, HTMLStencilElement {
    }
    var HTMLStsViewerElement: {
        prototype: HTMLStsViewerElement;
        new (): HTMLStsViewerElement;
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
    interface HTMLTokenInfoPopoverElement extends Components.TokenInfoPopover, HTMLStencilElement {
    }
    var HTMLTokenInfoPopoverElement: {
        prototype: HTMLTokenInfoPopoverElement;
        new (): HTMLTokenInfoPopoverElement;
    };
    interface HTMLTokenSecurityStatusElement extends Components.TokenSecurityStatus, HTMLStencilElement {
    }
    var HTMLTokenSecurityStatusElement: {
        prototype: HTMLTokenSecurityStatusElement;
        new (): HTMLTokenSecurityStatusElement;
    };
    interface HTMLTokenViewerElement extends Components.TokenViewer, HTMLStencilElement {
    }
    var HTMLTokenViewerElement: {
        prototype: HTMLTokenViewerElement;
        new (): HTMLTokenViewerElement;
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
    interface HTMLTransferDialogElement extends Components.TransferDialog, HTMLStencilElement {
    }
    var HTMLTransferDialogElement: {
        prototype: HTMLTransferDialogElement;
        new (): HTMLTransferDialogElement;
    };
    interface HTMLViewStepElement extends Components.ViewStep, HTMLStencilElement {
    }
    var HTMLViewStepElement: {
        prototype: HTMLViewStepElement;
        new (): HTMLViewStepElement;
    };
    interface HTMLViewerPopoverElement extends Components.ViewerPopover, HTMLStencilElement {
    }
    var HTMLViewerPopoverElement: {
        prototype: HTMLViewerPopoverElement;
        new (): HTMLViewerPopoverElement;
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
        "about-tokenscript": HTMLAboutTokenscriptElement;
        "action-bar": HTMLActionBarElement;
        "action-overflow-modal": HTMLActionOverflowModalElement;
        "add-selector": HTMLAddSelectorElement;
        "alphawallet-viewer": HTMLAlphawalletViewerElement;
        "app-root": HTMLAppRootElement;
        "attribute-table": HTMLAttributeTableElement;
        "card-modal": HTMLCardModalElement;
        "card-popover": HTMLCardPopoverElement;
        "card-view": HTMLCardViewElement;
        "confirm-step": HTMLConfirmStepElement;
        "input-field": HTMLInputFieldElement;
        "integration-viewer": HTMLIntegrationViewerElement;
        "loading-spinner": HTMLLoadingSpinnerElement;
        "new-viewer": HTMLNewViewerElement;
        "opensea-viewer": HTMLOpenseaViewerElement;
        "popover-dialog": HTMLPopoverDialogElement;
        "security-status": HTMLSecurityStatusElement;
        "select-field": HTMLSelectFieldElement;
        "select-step": HTMLSelectStepElement;
        "start-tab": HTMLStartTabElement;
        "sts-viewer": HTMLStsViewerElement;
        "tab-header-item": HTMLTabHeaderItemElement;
        "tabbed-viewer": HTMLTabbedViewerElement;
        "token-button": HTMLTokenButtonElement;
        "token-icon": HTMLTokenIconElement;
        "token-info-popover": HTMLTokenInfoPopoverElement;
        "token-security-status": HTMLTokenSecurityStatusElement;
        "token-viewer": HTMLTokenViewerElement;
        "tokens-grid": HTMLTokensGridElement;
        "tokens-grid-item": HTMLTokensGridItemElement;
        "tokenscript-button": HTMLTokenscriptButtonElement;
        "tokenscript-grid": HTMLTokenscriptGridElement;
        "transfer-dialog": HTMLTransferDialogElement;
        "view-step": HTMLViewStepElement;
        "viewer-popover": HTMLViewerPopoverElement;
        "viewer-tab": HTMLViewerTabElement;
        "wallet-button": HTMLWalletButtonElement;
        "wallet-selector": HTMLWalletSelectorElement;
    }
}
declare namespace LocalJSX {
    interface AboutTokenscript {
    }
    interface ActionBar {
        "actionsEnabled"?: boolean;
        "engine"?: TokenScriptEngine;
        "onHideLoader"?: (event: ActionBarCustomEvent<void>) => void;
        "onShowLoader"?: (event: ActionBarCustomEvent<void>) => void;
        "onShowToast"?: (event: ActionBarCustomEvent<ShowToastEventArgs>) => void;
        "tokenDetails"?: ITokenDetail;
        "tokenScript"?: TokenScript;
    }
    interface ActionOverflowModal {
    }
    interface AddSelector {
        "onFormSubmit"?: (type: TokenScriptSource, data: {tsId?: string, xml?: File}) => Promise<void>;
    }
    interface AlphawalletViewer {
        "app"?: AppRoot;
        "onHideLoader"?: (event: AlphawalletViewerCustomEvent<void>) => void;
        "onShowLoader"?: (event: AlphawalletViewerCustomEvent<void>) => void;
        "onShowToast"?: (event: AlphawalletViewerCustomEvent<ShowToastEventArgs>) => void;
    }
    interface AppRoot {
    }
    interface AttributeTable {
    }
    interface CardModal {
        "onShowToast"?: (event: CardModalCustomEvent<ShowToastEventArgs>) => void;
        "tokenScript"?: TokenScript1;
    }
    interface CardPopover {
        "onShowToast"?: (event: CardPopoverCustomEvent<ShowToastEventArgs>) => void;
        "tokenScript"?: TokenScript;
    }
    interface CardView {
    }
    interface ConfirmStep {
        "tokenScript"?: TokenScript1;
        "viewer"?: IntegrationViewer;
    }
    interface InputField {
        "label"?: string;
        "name"?: string;
        "pattern"?: string;
        "required"?: boolean;
        "type"?: string;
        "value"?: any;
    }
    interface IntegrationViewer {
        "app"?: AppRoot;
    }
    interface LoadingSpinner {
        "color"?: string;
        "size"?: "large"|"small";
    }
    interface NewViewer {
        "app"?: AppRoot;
        "onShowToast"?: (event: NewViewerCustomEvent<ShowToastEventArgs>) => void;
    }
    interface OpenseaViewer {
        "app"?: AppRoot;
        "onHideLoader"?: (event: OpenseaViewerCustomEvent<void>) => void;
        "onShowLoader"?: (event: OpenseaViewerCustomEvent<void>) => void;
        "onShowToast"?: (event: OpenseaViewerCustomEvent<ShowToastEventArgs>) => void;
    }
    interface PopoverDialog {
        "dialogStyles"?: {[cssProp: string]: string};
    }
    interface SecurityStatus {
        "size"?: "large"|"small";
        "tokenScript"?: TokenScript1;
    }
    interface SelectField {
        "label"?: string;
        "name"?: string;
        "options"?: {label: string, value: string}[];
        "value"?: string;
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
    interface StsViewer {
        "app"?: AppRoot;
        "onHideLoader"?: (event: StsViewerCustomEvent<void>) => void;
        "onShowLoader"?: (event: StsViewerCustomEvent<void>) => void;
        "onShowToast"?: (event: StsViewerCustomEvent<ShowToastEventArgs>) => void;
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
    interface TokenInfoPopover {
        "tokenScript"?: TokenScript;
    }
    interface TokenSecurityStatus {
        "originId"?: string;
        "tokenScript"?: TokenScript1;
    }
    interface TokenViewer {
        "app"?: AppRoot;
        "onHideLoader"?: (event: TokenViewerCustomEvent<void>) => void;
        "onShowLoader"?: (event: TokenViewerCustomEvent<void>) => void;
        "onShowToast"?: (event: TokenViewerCustomEvent<ShowToastEventArgs>) => void;
    }
    interface TokensGrid {
        "onHideLoader"?: (event: TokensGridCustomEvent<void>) => void;
        "onShowLoader"?: (event: TokensGridCustomEvent<void>) => void;
        "onShowToast"?: (event: TokensGridCustomEvent<ShowToastEventArgs>) => void;
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
        "onRemove"?: (tsId: string) => Promise<void>;
        "tokenScript"?: TokenScript1;
        "tsId"?: string;
    }
    interface TokenscriptGrid {
    }
    interface TransferDialog {
        "engine"?: TokenScriptEngine;
        "onHideLoader"?: (event: TransferDialogCustomEvent<void>) => void;
        "onShowLoader"?: (event: TransferDialogCustomEvent<void>) => void;
        "onShowToast"?: (event: TransferDialogCustomEvent<ShowToastEventArgs>) => void;
        "tokenDetails"?: ITokenDetail;
    }
    interface ViewStep {
        "card"?: Card;
        "onShowToast"?: (event: ViewStepCustomEvent<ShowToastEventArgs>) => void;
        "tokenScript"?: TokenScript1;
        "viewer"?: IntegrationViewer;
    }
    interface ViewerPopover {
    }
    interface ViewerTab {
        "app"?: AppRoot;
        "onShowToast"?: (event: ViewerTabCustomEvent<ShowToastEventArgs>) => void;
        "tabId"?: string;
        "tokenScript"?: TokenScript;
    }
    interface WalletButton {
    }
    interface WalletSelector {
    }
    interface IntrinsicElements {
        "about-tokenscript": AboutTokenscript;
        "action-bar": ActionBar;
        "action-overflow-modal": ActionOverflowModal;
        "add-selector": AddSelector;
        "alphawallet-viewer": AlphawalletViewer;
        "app-root": AppRoot;
        "attribute-table": AttributeTable;
        "card-modal": CardModal;
        "card-popover": CardPopover;
        "card-view": CardView;
        "confirm-step": ConfirmStep;
        "input-field": InputField;
        "integration-viewer": IntegrationViewer;
        "loading-spinner": LoadingSpinner;
        "new-viewer": NewViewer;
        "opensea-viewer": OpenseaViewer;
        "popover-dialog": PopoverDialog;
        "security-status": SecurityStatus;
        "select-field": SelectField;
        "select-step": SelectStep;
        "start-tab": StartTab;
        "sts-viewer": StsViewer;
        "tab-header-item": TabHeaderItem;
        "tabbed-viewer": TabbedViewer;
        "token-button": TokenButton;
        "token-icon": TokenIcon;
        "token-info-popover": TokenInfoPopover;
        "token-security-status": TokenSecurityStatus;
        "token-viewer": TokenViewer;
        "tokens-grid": TokensGrid;
        "tokens-grid-item": TokensGridItem;
        "tokenscript-button": TokenscriptButton;
        "tokenscript-grid": TokenscriptGrid;
        "transfer-dialog": TransferDialog;
        "view-step": ViewStep;
        "viewer-popover": ViewerPopover;
        "viewer-tab": ViewerTab;
        "wallet-button": WalletButton;
        "wallet-selector": WalletSelector;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "about-tokenscript": LocalJSX.AboutTokenscript & JSXBase.HTMLAttributes<HTMLAboutTokenscriptElement>;
            "action-bar": LocalJSX.ActionBar & JSXBase.HTMLAttributes<HTMLActionBarElement>;
            "action-overflow-modal": LocalJSX.ActionOverflowModal & JSXBase.HTMLAttributes<HTMLActionOverflowModalElement>;
            "add-selector": LocalJSX.AddSelector & JSXBase.HTMLAttributes<HTMLAddSelectorElement>;
            "alphawallet-viewer": LocalJSX.AlphawalletViewer & JSXBase.HTMLAttributes<HTMLAlphawalletViewerElement>;
            "app-root": LocalJSX.AppRoot & JSXBase.HTMLAttributes<HTMLAppRootElement>;
            "attribute-table": LocalJSX.AttributeTable & JSXBase.HTMLAttributes<HTMLAttributeTableElement>;
            "card-modal": LocalJSX.CardModal & JSXBase.HTMLAttributes<HTMLCardModalElement>;
            "card-popover": LocalJSX.CardPopover & JSXBase.HTMLAttributes<HTMLCardPopoverElement>;
            "card-view": LocalJSX.CardView & JSXBase.HTMLAttributes<HTMLCardViewElement>;
            "confirm-step": LocalJSX.ConfirmStep & JSXBase.HTMLAttributes<HTMLConfirmStepElement>;
            "input-field": LocalJSX.InputField & JSXBase.HTMLAttributes<HTMLInputFieldElement>;
            "integration-viewer": LocalJSX.IntegrationViewer & JSXBase.HTMLAttributes<HTMLIntegrationViewerElement>;
            "loading-spinner": LocalJSX.LoadingSpinner & JSXBase.HTMLAttributes<HTMLLoadingSpinnerElement>;
            "new-viewer": LocalJSX.NewViewer & JSXBase.HTMLAttributes<HTMLNewViewerElement>;
            "opensea-viewer": LocalJSX.OpenseaViewer & JSXBase.HTMLAttributes<HTMLOpenseaViewerElement>;
            "popover-dialog": LocalJSX.PopoverDialog & JSXBase.HTMLAttributes<HTMLPopoverDialogElement>;
            "security-status": LocalJSX.SecurityStatus & JSXBase.HTMLAttributes<HTMLSecurityStatusElement>;
            "select-field": LocalJSX.SelectField & JSXBase.HTMLAttributes<HTMLSelectFieldElement>;
            "select-step": LocalJSX.SelectStep & JSXBase.HTMLAttributes<HTMLSelectStepElement>;
            "start-tab": LocalJSX.StartTab & JSXBase.HTMLAttributes<HTMLStartTabElement>;
            "sts-viewer": LocalJSX.StsViewer & JSXBase.HTMLAttributes<HTMLStsViewerElement>;
            "tab-header-item": LocalJSX.TabHeaderItem & JSXBase.HTMLAttributes<HTMLTabHeaderItemElement>;
            "tabbed-viewer": LocalJSX.TabbedViewer & JSXBase.HTMLAttributes<HTMLTabbedViewerElement>;
            "token-button": LocalJSX.TokenButton & JSXBase.HTMLAttributes<HTMLTokenButtonElement>;
            "token-icon": LocalJSX.TokenIcon & JSXBase.HTMLAttributes<HTMLTokenIconElement>;
            "token-info-popover": LocalJSX.TokenInfoPopover & JSXBase.HTMLAttributes<HTMLTokenInfoPopoverElement>;
            "token-security-status": LocalJSX.TokenSecurityStatus & JSXBase.HTMLAttributes<HTMLTokenSecurityStatusElement>;
            "token-viewer": LocalJSX.TokenViewer & JSXBase.HTMLAttributes<HTMLTokenViewerElement>;
            "tokens-grid": LocalJSX.TokensGrid & JSXBase.HTMLAttributes<HTMLTokensGridElement>;
            "tokens-grid-item": LocalJSX.TokensGridItem & JSXBase.HTMLAttributes<HTMLTokensGridItemElement>;
            "tokenscript-button": LocalJSX.TokenscriptButton & JSXBase.HTMLAttributes<HTMLTokenscriptButtonElement>;
            "tokenscript-grid": LocalJSX.TokenscriptGrid & JSXBase.HTMLAttributes<HTMLTokenscriptGridElement>;
            "transfer-dialog": LocalJSX.TransferDialog & JSXBase.HTMLAttributes<HTMLTransferDialogElement>;
            "view-step": LocalJSX.ViewStep & JSXBase.HTMLAttributes<HTMLViewStepElement>;
            "viewer-popover": LocalJSX.ViewerPopover & JSXBase.HTMLAttributes<HTMLViewerPopoverElement>;
            "viewer-tab": LocalJSX.ViewerTab & JSXBase.HTMLAttributes<HTMLViewerTabElement>;
            "wallet-button": LocalJSX.WalletButton & JSXBase.HTMLAttributes<HTMLWalletButtonElement>;
            "wallet-selector": LocalJSX.WalletSelector & JSXBase.HTMLAttributes<HTMLWalletSelectorElement>;
        }
    }
}
