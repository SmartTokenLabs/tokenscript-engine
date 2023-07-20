import {
	EAS,
	Offchain, OFFCHAIN_ATTESTATION_TYPES, SchemaEncoder, SchemaRecord,
	SchemaRegistry,
	SignedOffchainAttestation
} from "@ethereum-attestation-service/eas-sdk";
import {
	decodeBase64ZippedBase64,
} from "./AttestationUrl";
import {BigNumber, ethers} from "ethers";
import {defaultAbiCoder, joinSignature, keccak256} from "ethers/lib/utils";
import {IAttestationData} from "./IAttestationStorageAdapter";


export const EAS_RPC_CONFIG = {
	1: 'https://eth-mainnet.g.alchemy.com/v2/2bJxn0VGXp9U5EOfA6CoMGU-rrd-BIIT',
	11155111: 'https://rpc.sepolia.org/',
	42161: 'https://arb1.arbitrum.io/rpc'
}

export const EAS_REGISTRY_CONFIG = {
	1: "0xA7b39296258348C78294F95B872b282326A97BDF",
	11155111: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",
}

export class Attestation {

	private eas: EAS;
	private offChain: Offchain;
	private schemaRegistry: SchemaRegistry;

	private attestation: SignedOffchainAttestation
	private signerAddress: string;
	private signerPublicKey: string;
	private schemaRecord?: SchemaRecord;
	private decodedData?: {[name: string]: any}

	constructor(
		private type: string,
		private base64Attestation: string,
		private meta: {[name: string]: any} = {}
	) {
		const decoded = decodeBase64ZippedBase64(base64Attestation);
		this.attestation = decoded.sig as SignedOffchainAttestation;

		const domain = this.attestation.domain;

		if (!EAS_RPC_CONFIG[domain.chainId])
			throw new Error(`EAS chain ID ${domain.chainId} is not supported`);

		// TODO: Add all contract versions
		if (!EAS_REGISTRY_CONFIG[domain.chainId])
			throw new Error(`EAS schema registry address not available for chain ID ${domain.chainId}`);

		this.offChain = new Offchain({
			version: domain.version,
			address: domain.verifyingContract,
			chainId: domain.chainId
		}, 1);

		const provider = new ethers.providers.JsonRpcProvider(EAS_RPC_CONFIG[domain.chainId], domain.chainId);

		this.eas = new EAS(domain.verifyingContract, {
			signerOrProvider: provider
		})

		this.schemaRegistry = new SchemaRegistry(EAS_REGISTRY_CONFIG[domain.chainId], {
			signerOrProvider: provider
		})

		this.recoverSignerInfo();
	}

	private recoverSignerInfo(){

		const hash = ethers.utils._TypedDataEncoder.hash(this.offChain.getDomainTypedData(), {Attest: OFFCHAIN_ATTESTATION_TYPES[0].types}, this.attestation.message);

		this.signerPublicKey = ethers.utils.recoverPublicKey(hash, this.attestation.signature);
		this.signerAddress = ethers.utils.recoverAddress(hash, this.attestation.signature);

		console.log("Signer key: ", this.signerPublicKey)
	}

	public async getSchemaRecord(){

		if (!this.schemaRecord) {
			this.schemaRecord = await this.schemaRegistry.getSchema({uid: this.attestation.message.schema});
		}

		return this.schemaRecord;
	}

	public async verifyAttestation(){

		// Verify signature - not really needed since we are recovering public key and address in the signature
		// this.offChain.verifyOffchainAttestationSignature(this.signerAddress, this.attestation);

		// Verify expiry
		const now = Math.round(Date.now() / 1000);

		if (now < this.attestation.message.time)
			throw new Error("Attestation not yet valid.");

		if (this.attestation.message.expirationTime > 0 && now > this.attestation.message.expirationTime)
			throw new Error("Attestation has expired.");

		// Verify revocation
		const schemaRecord = await this.getSchemaRecord();

		if (!schemaRecord.revocable)
			return;

		const revoked = await this.eas.getRevocationOffchain(this.signerAddress, this.attestation.uid);

		if (BigNumber.from(revoked).gt(0)) {
			const msg = "Attestation has been revoked :-(";
			//alert(msg);
			throw new Error(msg);
		}
	}

	public async getAttestationData(){

		if (!this.decodedData) {

			const schemaRecord = await this.getSchemaRecord();
			const schemaEncoder = new SchemaEncoder((await schemaRecord).schema)
			const data = schemaEncoder.decodeData(this.attestation.message.data);

			this.decodedData = {};

			let index = 0

			for (const value of data) {
				this.decodedData[value.name] = data[index].value.value;
				index++;
			}
		}

		return this.decodedData;
	}

	getAttestationField(fieldName: string){

		const data = this.getAttestationData();

		if (!data[fieldName]) {
			throw new Error("The attestation does not contain data field '" + fieldName + "'");
		}

		return data[fieldName]
	}

	async getAttestationId(idFields: string[]){

		if (!idFields.length){
			return this.attestation.uid;
		}

		const data = await this.getAttestationData();

		const parts = [];

		for (const field of idFields){
			if (data[field])
				parts.push(data[field]);
		}

		return parts.join("-");
	}

	async getCollectionHash(){

		const parts = [];

		parts.push(this.attestation.message.schema.substring(2));
		parts.push(this.signerAddress.substring(2).toLowerCase());

		const data = await this.getAttestationData();

		if (data.eventId)
			parts.push(data.eventId);

		const encoder = new TextEncoder();

		return keccak256(encoder.encode(parts.join("")));
	}

	public async getDatabaseRecord(idFields: string[]): Promise<IAttestationData> {

		return <IAttestationData>{
			collectionId: await this.getCollectionHash(),
			tokenId: await this.getAttestationId(idFields),
			type: "eas",
			token: this.base64Attestation,
			decodedToken: this.attestation,
			decodedData: await this.getAttestationData(),
			meta: this.meta,
			dt: Date.now()
		};
	}

	public static getAbiEncodedEasAttestation(signedAttestation: SignedOffchainAttestation){

		const attestation = defaultAbiCoder.encode(
			signedAttestation.types.Attest.map((field) => field.type),
			signedAttestation.types.Attest.map((field) => signedAttestation.message[field.name])
		);

		const domain = defaultAbiCoder.encode(
			["string", "uint256", "address"],
			[signedAttestation.domain.version, signedAttestation.domain.chainId, signedAttestation.domain.verifyingContract]
		);

		return {attestation, domain, signature: joinSignature(signedAttestation.signature)}
	}

}
