import * as crypto from 'crypto';

export class CustomApiKeyStamper {
  private apiPublicKey: string;
  private apiPrivateKey: string;

  constructor(config: { apiPublicKey: string; apiPrivateKey: string }) {
    this.apiPublicKey = config.apiPublicKey;
    this.apiPrivateKey = config.apiPrivateKey;
  }

  async stamp(payload: string): Promise<{ stampHeaderName: string; stampHeaderValue: string }> {
    try {
      // Create ECDSA signature using the secp256k1 curve
      const privateKeyBuffer = Buffer.from(this.apiPrivateKey, 'hex');
      
      // Create hash of the payload
      const payloadHash = crypto.createHash('sha256').update(payload).digest();
      
      // Sign the hash using ECDSA
      const sign = crypto.createSign('SHA256');
      sign.update(payloadHash);
      
      // Create a proper private key object for secp256k1
      const privateKeyPem = this.createSecp256k1PrivateKeyPem(privateKeyBuffer);
      const signature = sign.sign(privateKeyPem, 'base64');

      // Create the stamp header value in base64 format
      const stampData = {
        publicKey: this.apiPublicKey,
        signature: signature
      };
      
      const stampHeaderValue = Buffer.from(JSON.stringify(stampData)).toString('base64');

      return {
        stampHeaderName: 'X-Stamp',
        stampHeaderValue: stampHeaderValue
      };
    } catch (error) {
      console.error('Error creating stamp:', error);
      throw new Error(`Failed to create stamp: ${error}`);
    }
  }

  private createSecp256k1PrivateKeyPem(privateKeyBuffer: Buffer): string {
    // Create a PEM format private key for secp256k1
    const privateKeyHex = privateKeyBuffer.toString('hex');
    const privateKeyBase64 = Buffer.from(privateKeyHex, 'hex').toString('base64');
    
    return `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;
  }
}