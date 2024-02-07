import {TokenScript} from "@tokenscript/engine-js/src/TokenScript";
import {ITokenDetail} from "@tokenscript/engine-js/src/tokens/ITokenDetail";

export const getHardcodedDescription = async (tokenScript: TokenScript, details: ITokenDetail) => {

	const SABLIER_ADDRESSES = [
		"0xAFb979d9afAd1aD27C5eFf4E27226E3AB9e5dCC9".toLowerCase(),
		"0x7a43F8a888fa15e68C103E18b0439Eb1e98E4301".toLowerCase()
	]

	if (SABLIER_ADDRESSES.indexOf(details.collectionDetails.contractAddress.toLowerCase()) > -1){

		const SLN_ADDRESSES = [
			"0xdb82c0d91e057e05600c8f8dc836beb41da6df14".toLowerCase(),
			"0xF5F355746e64f5cDdd471205e9042153dB84387A".toLowerCase(),
			"0x0404ab3994ed48c300ce219546f757ad34484dc7".toLowerCase()
		]

		try {
			const stream = await tokenScript.getAttributes().getAttribute("stream").getValue();

			if (stream?.asset && SLN_ADDRESSES.indexOf(stream.asset.toLowerCase()) > -1)
				return `As the holder of this NFT, you have the right to withdraw the SLN tokens.

Transferring this NFT will give the right to withdraw to the new owner.
$SLN tokens are not automatically withdrawn for the previous holder and must be done manually.

Enabled by Sablier V2 Lockup Linear Contract.
Stream ID ${details.tokenId}: ${details.collectionDetails.contractAddress}
SLN Address: ${stream.asset}
				`;

		} catch (e) {

		}
	}

	return details.description;
}
