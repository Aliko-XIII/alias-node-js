import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema()
export class Auth extends Document { }

export const AuthSchema = SchemaFactory.createForClass(Auth);
