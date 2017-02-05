// @flow

import jwt from 'jsonwebtoken';
import { AdminUser } from './model';
import { jwtSecret } from './config';

export async function getAdminUser(token: string) {
  if (!token) return null;

  try {
    const decodedToken = jwt.verify(token.substring(4), jwtSecret);
    return await AdminUser.findOne({ _id: decodedToken.id });
  } catch (err) {
    return null;
  }
}
