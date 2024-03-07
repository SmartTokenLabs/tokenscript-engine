import {TokenScriptsMeta} from "../providers/databaseProvider";

export const knownTokenScripts: TokenScriptsMeta[] = [
	{
		tokenScriptId: "ENS",
		loadType: "resolve",
		name: "ENS",
		iconUrl: "/assets/tokenscript-icons/ENS.png"
	},
	{
		tokenScriptId: "DAI",
		loadType: "resolve",
		name: "DAI",
		iconUrl: "/assets/tokenscript-icons/DAI.png"
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
];

export const getKnownTokenScriptMetaById = (tsId: string) => {

	for (const meta of knownTokenScripts){
		if (tsId === meta.tokenScriptId)
			return meta;
	}

	return null;
}
