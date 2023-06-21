import {
	EAS,
	getOffchainUID,
	Offchain, OFFCHAIN_ATTESTATION_TYPES, SchemaEncoder, SchemaRecord,
	SchemaRegistry,
	SignedOffchainAttestation
} from "@ethereum-attestation-service/eas-sdk";
import {
	decodeBase64ZippedBase64,
} from "./AttestationUrl";
import {BigNumber, ethers} from "ethers";

export const EAS_RPC_CONFIG = {
	1: 'https://eth-mainnet.g.alchemy.com/v2/2bJxn0VGXp9U5EOfA6CoMGU-rrd-BIIT',
	11155111: 'https://rpc.sepolia.org/',
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
		private id?: string,
		private secret?: string
	) {
		const decoded = decodeBase64ZippedBase64(base64Attestation);
		this.attestation = decoded.sig as SignedOffchainAttestation;

		const domain = this.attestation.domain;

		if (!EAS_RPC_CONFIG[domain.chainId])
			throw new Error(`EAS chain ID ${domain.chainId} is not supported`);

		this.offChain = new Offchain({
			version: domain.version,
			address: domain.verifyingContract,
			chainId: domain.chainId
		}, 1);

		const provider = new ethers.providers.JsonRpcProvider(EAS_RPC_CONFIG[domain.chainId], domain.chainId);

		this.eas = new EAS(domain.verifyingContract, {
			signerOrProvider: provider
		})

		this.schemaRegistry = new SchemaRegistry(domain.verifyingContract, {
			signerOrProvider: provider
		})

		this.recoverSignerInfo();
	}

	private recoverSignerInfo(){

		const hash = ethers.utils._TypedDataEncoder.hash(this.offChain.getDomainTypedData(), {Attestation: OFFCHAIN_ATTESTATION_TYPES[1].types}, this.attestation.message);

		this.signerPublicKey = ethers.utils.recoverPublicKey(hash, this.attestation.signature);
		this.signerAddress = ethers.utils.recoverAddress(hash, this.attestation.signature)
	}

	public async getSchemaRecord(){

		if (this.schemaRecord)
			return this.schemaRecord;

		// Get schema from registry
		const schemaUid = this.attestation.message.schema;

		this.schemaRecord = await this.schemaRegistry.getSchema({uid: schemaUid});
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

			const schemaRecord = this.getSchemaRecord();
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

}
