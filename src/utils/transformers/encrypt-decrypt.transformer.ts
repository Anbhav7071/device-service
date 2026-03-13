import { ValueTransformer } from 'typeorm';
import { EncryptionTransformer } from 'typeorm-encrypted';
import dotenv from 'dotenv';

dotenv.config();

class EncryptionUtil {
  private static readonly key = process.env.ENCRYPTION_KEY!;
  private static readonly algorithm = process.env.ENCRYPTION_METHOD!;
  private static readonly iv = process.env.IV!;
  private static readonly ivLength = 16;

  // Returns a basic encryption transformer
  static get EncryptDecryptTransformer(): ValueTransformer {
    const baseTransformer = new EncryptionTransformer({
      key: this.key,
      algorithm: this.algorithm,
      iv: this.iv,
      ivLength: this.ivLength,
    });

    return {
      to: (value: any) => {
        if (value === null || value === undefined) {
          return null;
        }
        return baseTransformer.to(value);
      },
      from: (value: any) => {
        if (value === null || value === undefined) {
          return null;
        }
        return baseTransformer.from(value);
      },
    };
  }

  // Returns a composed transformer for JSON + encryption
  static get ComposedJsonTransformer(): ValueTransformer {
    const transformer = this.EncryptDecryptTransformer;

    return {
      to: (value: any) => {
        const json = value
          ? typeof value === 'string'
            ? value
            : JSON.stringify(value)
          : '{}';
        return transformer.to(json);
      },
      from: (value: any) => {
        if (!value) return {};
        try {
          const decrypted = transformer.from(value);
          return typeof decrypted === 'string'
            ? JSON.parse(decrypted)
            : decrypted;
        } catch (error) {
          console.error('Failed to decrypt or parse JSON:', error);
          return {};
        }
      },
    };
  }
}

export default EncryptionUtil;
