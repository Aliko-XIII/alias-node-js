import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
export class Team {
  @Prop({ type: Types.ObjectId, ref: 'rooms', required: true })
  roomId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  teamScore: number;

  @Prop({ type: Types.ObjectId, ref: 'words' })
  selectedWord: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'users', default: [] }) // Keep default as an empty array, delete required: true
  players: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, default: null }) // Keep default as null, delete required: true;
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', default: null }) // Keep default as null, delete required: true
  describer: Types.ObjectId;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: [Types.ObjectId], ref: 'words', default: [] })
  tryedWords: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'users', default: null }) // Keep default as null, delete required: true
  teamLeader: Types.ObjectId;

  @Prop({ type: Boolean, default: null })
  success: boolean;

  @Prop({ type: String, default: null })
  answer: string;
}

export type TeamDocument = HydratedDocument<Team>;
export const TeamSchema = SchemaFactory.createForClass(Team);
