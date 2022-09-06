import bindings from 'bindings'
import { Struct, StructCreator } from './struct'
const addon = bindings('jitffi')

export enum CType {
  ptr = 1,
  u64,
  i64,
  u32,
  i32,
  u16,
  i16,
  u8,
  i8,
  f64,
  f32,
  void
}

export const CTypeSize = {
  [CType.ptr]: addon.pointerSize,
  [CType.u64]: 8,
  [CType.i64]: 8,
  [CType.u32]: 4,
  [CType.i32]: 4,
  [CType.u16]: 2,
  [CType.i16]: 2,
  [CType.u8]: 1,
  [CType.i8]: 1,
  [CType.f64]: 8,
  [CType.f32]: 4,
  [CType.void]: 0
}

export type NativeType = CType | StructCreator<any>

export function sizeOf(type: NativeType) {
  if (typeof type === 'number') {
    return CTypeSize[type]
  } else {
    return type.size
  }
}

export const nullptr = Buffer.alloc(8)

export interface TypeMap {
  [CType.ptr]: Buffer,
  [CType.u64]: bigint,
  [CType.i64]: bigint,
  [CType.u32]: number,
  [CType.i32]: number,
  [CType.u16]: number,
  [CType.i16]: number,
  [CType.u8]: number,
  [CType.i8]: number,
  [CType.f64]: number,
  [CType.f32]: number,
  [CType.void]: undefined
}

export type ExtractStructCreator<Type> = Type extends StructCreator<infer X> ? X : never
export type NativeValue<T extends NativeType> = T extends CType ? TypeMap[T] : Struct<ExtractStructCreator<T>>