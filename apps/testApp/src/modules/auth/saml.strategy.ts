import { Strategy } from 'passport-saml';

import { Injectable, Scope, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { UserService } from '../../modules/user/user.service';
import { ConfigService } from '../../shared/services/config.service';

import * as _ from 'lodash';
import { SamlObject } from '../../interfaces';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor(
    public readonly configService: ConfigService,
    public readonly userService: UserService,
    @Inject(REQUEST) request,
  ) {
    super({
      entryPoint: request['SAML_ENTRYPOINT'],
      //configService.get('SAML_ENTRYPOINT1'),
      issuer: request['SAML_APP_ID'],
      // configService.get('SAML_APP_ID'),
      callbackUrl: request['SAML_CALLBACK_URL'],
      // configService.get('SAML_CALLBACK_URL'),
      acceptedClockSkewMs: configService.getNumber(
        'SAML_ACCEPTED_CLOCK_SKEW_MS',
      ),
      identifierFormat: configService.get('SAML_IDENTIFIER_FORMAT') || null,
      signatureAlgorithm: configService.get('SAML_SIGNATURE_ALGORITHM'),
      disableRequestedAuthnContext: configService.getBoolean(
        'SAML_DISABLE_REQUESTED_AUTHN_CONTEXT',
      ),
      // passReqToCallback: configService.getBoolean('SAML_PASS_REQ_CALLBACK'),
      passReqToCallBack: true,
    });
  }

  async validate(profile, done) {
    try {
      const url = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/';
      const _mapper = {
        [`${url}name`]: 'name', // email
        [`${url}emailaddress`]: 'email', // email
        [`${url}surname`]: 'surname',
        [`${url}givenname`]: 'givenname',
      };
      const finalUserDataSAML: SamlObject = {};

      _.forEach(_mapper, function(val, key) {
        finalUserDataSAML[val] = profile[key];
      });
      return done(null, finalUserDataSAML);
    } catch (err) {
      done(err, false);
    }
  }
}
