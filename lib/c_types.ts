import bindings from 'bindings'
import { StructCreator } from './struct'
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