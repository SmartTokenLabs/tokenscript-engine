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
		tokenScriptId: "5-0x8c36A92536784A5C59E28311c0961Ed06e9Bca5d",
		loadType: "resolve",
		name: "Devcon Souvenir",
		iconUrl: "/assets/tokenscript-icons/devcon-souvenir.png"
	},
	{
		tokenScriptId: "5-0x82cBd60183e8255DA0638fA73A9A6dC6826b3c28",
		loadType: "resolve",
		name: "Devcon Referral",
		iconUrl: "/assets/tokenscript-icons/devcon-referral.png"
	},
];

export const getKnownTokenScriptMetaById = (tsId: string) => {

	for (const meta of knownTokenScripts){
		if (tsId === meta.tokenScriptId)
			return meta;
	}

	return null;
}
