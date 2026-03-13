import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor() {
        let publicKey = process.env.JWT_PUBLIC_KEY || '';
        if (!publicKey && process.env.JWT_PUBLIC_KEY_PATH) {
            try {
                publicKey = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8');
            } catch (err) {
                // We will let passport fail later if no context is found, but log it.
            }
        }
        // Fallback for local development so it doesn't crash if omitted
        if (!publicKey) {
            publicKey = 'dev-secret-key-1234';
        }

        super({
            // We will extract from Authorzation header
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // The platform layer signs the JWT. Device service only verifies using the Public Key.
            secretOrKey: publicKey,
            algorithms: publicKey.includes('BEGIN') ? ['RS256'] : ['HS256'], // Use RS256 if RSA key provided
        });
    }

    async validate(payload: any) {
        if (!payload.sub) {
            throw new UnauthorizedException();
        }
        // For stateless JWT parsing, we simply return the exact payload on the request.
        // The roles guard and permission policy handles the raw `permissions` list.
        return {
            sub: payload.sub,
            tenantId: payload.tenantId,
            roleId: payload.roleId,
            permissions: payload.permissions || [],
            taxonomyIds: payload.taxonomyIds || [],
        };
    }
}
