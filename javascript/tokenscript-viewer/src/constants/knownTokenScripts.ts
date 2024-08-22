import {TokenScriptsMeta} from "../providers/databaseProvider";

export const knownTokenScripts: TokenScriptsMeta[] = [
	{
		tokenScriptId: "137-0xB48f53010Acbc0E24D3D12D892E2215879e6fD13",
		loadType: "resolve",
		name: "MORCHI",
		iconUrl: "https://cdn.jsdelivr.net/gh/SmartTokenLabs/resources/images/logos/MORCHI.png"
	},
	{
		tokenScriptId: "8217-0x4e3f3a3dba12cec714cba0508a1bab8ead85af31",
		loadType: "resolve",
		name: "Seven Dragons",
		iconUrl: "https://resources.smartlayer.network/smart-token-store/images/seven-dragon/market-tile.png"
	},
	{
		tokenScriptId: "185-0x80A6da00140C4798bAba3b3f362839b6f87b6fc6",
		loadType: "resolve",
		name: "Mint Cats",
		iconUrl: "https://resources.smartlayer.network/smart-token-store/images/mint/market-tile-2.png"
	},
	{
		tokenScriptId: "137-0xD5cA946AC1c1F24Eb26dae9e1A53ba6a02bd97Fe",
		loadType: "resolve",
		name: "SmartCat",
		iconUrl: "/assets/tokenscript-icons/smart-cat.png"
	},
	{
		tokenScriptId: "137-0x0D86C720e1Eb8CAb197707fDCFF9D7B218612a60",
		loadType: "resolve",
		name: "SmartCat Loot",
		iconUrl: "/assets/tokenscripts/smart-cat/loot-meta/contract.png"
	},
	// {
	// 	tokenScriptId: "1-0x3c7e352481f4b2fdec1e642a3f0018661c77513d",
	// 	loadType: "resolve",
	// 	name: "DevconVI",
	// 	iconUrl: "https://cdn.jsdelivr.net/gh/SmartTokenLabs/resources/images/logos/devcon-vi.png"
	// },
	// {
	// 	tokenScriptId: "1-0x0c8b0e8f975bf3dfb99904005385e825a391af81",
	// 	loadType: "resolve",
	// 	name: "Nifty Tailor Suit Up",
	// 	iconUrl: "https://cdn.jsdelivr.net/gh/SmartTokenLabs/resources/images/logos/nifty-tailor-suit-up.png"
	// },
	{
		tokenScriptId: "1-0xDb82c0d91E057E05600C8F8dc836bEb41da6df14",
		loadType: "resolve",
		name: "SLN Ethereum",
		iconUrl: "https://cdn.jsdelivr.net/gh/SmartTokenLabs/resources/images/sln/sln-front-facing-logo-ts.webp"
	}, 
	{
		tokenScriptId: "137-0x1fe78e67ad10ba3a9583e672cac0480737d1b9f7",
		loadType: "resolve",
		name: "SLN Polygon",
		iconUrl: "https://cdn.jsdelivr.net/gh/SmartTokenLabs/resources/images/sln/sln-front-facing-logo-ts.webp"
	},
	{
		tokenScriptId: "ENS",
		loadType: "resolve",
		name: "ENS",
		iconUrl: "/assets/tokenscript-icons/ENS.png"
	},
	{
		tokenScriptId: "1-0x6b175474e89094c44da98b954eedeac495271d0f",
		loadType: "resolve",
		name: "DAI",
		iconUrl: "https://resources.smartlayer.network/smart-token-store/images/dai-logo.svg"
	},
	{
		tokenScriptId: "1-0xdac17f958d2ee523a2206206994597c13d831ec7",
		loadType: "resolve",
		name: "USDT",
		iconUrl: "https://resources.smartlayer.network/smart-token-store/images/tether-logo.svg"
	},
	{
		tokenScriptId: "1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		loadType: "resolve",
		name: "USDC",
		iconUrl: "https://resources.smartlayer.network/smart-token-store/images/usdc-logo.svg"
	},
	{
		tokenScriptId: "1-0x514910771af9ca656af840dff83e8264ecf986ca",
		loadType: "resolve",
		name: "LINK",
		iconUrl: "https://resources.smartlayer.network/smart-token-store/images/chainlink-logo.svg"
	},
	{
		tokenScriptId: "1-0xAFb979d9afAd1aD27C5eFf4E27226E3AB9e5dCC9",
		loadType: "resolve",
		name: "Sablier Ethereum",
		iconUrl: "https://api.thegraph.com/ipfs/api/v0/cat?arg=QmZCYxNUHghpEg7V59a2dXYC1C7DdxEayiwrYpJV9jwoaN"
	},
	{
		tokenScriptId: "137-0x5f0e1dea4A635976ef51eC2a2ED41490d1eBa003",
		loadType: "resolve",
		name: "Sablier Polygon",
		iconUrl: "https://api.thegraph.com/ipfs/api/v0/cat?arg=QmZCYxNUHghpEg7V59a2dXYC1C7DdxEayiwrYpJV9jwoaN"
	},
	/*{
		tokenScriptId: "137-0xf925027b8C521939f25CE633FEFd7777a1660D86",
		loadType: "resolve",
		name: "Redbrick",
		iconUrl: "https://resources.smartlayer.network/smart-token-store/images/seven-dragon/market-tile.png"
	},*/
];

export const getKnownTokenScriptMetaById = (tsId: string) => {

	for (const meta of knownTokenScripts){
		if (tsId === meta.tokenScriptId)
			return meta;
	}

	return null;
}
