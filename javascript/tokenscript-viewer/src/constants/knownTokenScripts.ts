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
];

export const getKnownTokenScriptMetaById = (tsId: string) => {

	for (const meta of knownTokenScripts){
		if (tsId === meta.tokenScriptId)
			return meta;
	}

	return null;
}
