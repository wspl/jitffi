import { CType, NativeType } from "../c_types";
import { defineStruct, Struct, StructCreator } from "../struct";
import { Reg64 } from "./x64";

export const ARG_REG_INT_GENERAL = [Reg64.rdi, Reg64.rsi, Reg64.rdx, Reg64.rcx, Reg64.r8, Reg64.r9]
export const ARG_REG_INT_RETURN_AS_ARG = [Reg64.rsi, Reg64.rdx, Reg64.rcx, Reg64.r8, Reg64.r9]
export const ARG_REG_FLOAT = [Reg64.xmm0, Reg64.xmm1, Reg64.xmm2, Reg64.xmm3, Reg64.xmm4, Reg64.xmm5, Reg64.xmm6, Reg64.xmm7]
const PRIMITIVE_SIZE = [1, 2, 4, 8]

export function isPrimitiveStruct(st: StructCreator<any>) {
  return PRIMITIVE_SIZE.includes(st.size)
}

export function primitiveStructToCIntType(st: StructCreator<any>) {
  switch (st.size) {
    case 1: {
      return CType.i8
    }
    case 2: {
      return CType.i16
    }
    case 4: {
      return CType.i32
    }
    case 8: {
      return CType.i64
    }
    default: {
      throw 'not a primitive struct'
    }
  }
}

export function primitiveStructToCFloatType(st: StructCreator<any>) {
  switch (st.size) {
    case 4: {
      return CType.f32
    }
    case 8: {
      return CType.f64
    }
    default: {
      throw 'not a primitive struct'
    }
  }
}

export function isFloatStruct(st: StructCreator<any>) {
  if (!PRIMITIVE_SIZE.includes(st.size)) return false
  return Object.values(st.args).every(t => t === CType.f32 || t === CType.f64)
}

// SystemV ABI would pass a struct argument which size > 8 and <= 16
// by divide them into two 8 bytes, and put them to next two available registers.
// (if only 1 regisiter availble, struct will pass by stack)
// (nested struct should be flatten to calculate)
// 
// Examples:
// | i64 | i64 | -- divide to two int reg
// | i64 | i8  | -- divide to two int reg
// | float | double | -- divide to two xmm reg
// | i64 | float | -- divide to an int reg and a xmm reg
// | i32 | i64 | i32 | -- no divide, pass by stack
export function tryStructDivide(st: StructCreator<any>): null | [ArgTarget, ArgTarget] {
  if (st.size <= 8 || st.size > 16) {
    return null
  }
  const offsets: number[] = []
  const left: CType[] = []
  const right: CType[] = []
  const traverseOffset = (st: StructCreator<any>, offset: number) => {
    Object.entries(st.args).forEach(([key, value]) => {
      const o = offset + st.offsetMap[key]
      if (typeof value !== 'number') {
        traverseOffset(value as StructCreator<any>, o)
      } else {
        offsets.push(o)
        if (o < 8) {
          left.push(value)
        } else {
          right.push(value)
        }
      }
    })
  }
  traverseOffset(st, 0)
  if (!offsets.includes(8)) {
    return null
  }
  return [
    left.every(t => t === CType.f32 || t === CType.f64) ? ArgTarget.sse : ArgTarget.int,
    right.every(t => t === CType.f32 || t === CType.f64) ? ArgTarget.sse : ArgTarget.int,
  ]
}

export enum ArgTarget {
  int,
  sse,
  stack
}

export interface ArgInfo {
  bufferAddress: bigint
  type: CType
  size?: number
}

export function groupArgs(
  ARG_REG_INT: Reg64[],
  args: NativeType[],
  addressOfArg: (i: number) => bigint
) {
  const intRegArgs: ArgInfo[] = []
  const floatRegArgs: ArgInfo[] = []
  const stackArgs: ArgInfo[] = []

  const pushInt = (i: ArgInfo) => {
    if (intRegArgs.length === ARG_REG_INT.length) {
      stackArgs.push(i)
    } else {
      intRegArgs.push(i)
    }
  }

  const pushFloat = (i: ArgInfo) => {
    if (floatRegArgs.length === ARG_REG_FLOAT.length) {
      stackArgs.push(i)
    } else {
      floatRegArgs.push(i)
    }
  }

  const pushStack = (i: ArgInfo) => {
    stackArgs.push(i)
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === CType.f32 || arg === CType.f64) {
      // float
      pushFloat({
        bufferAddress: addressOfArg(i),
        type: arg
      })
    } else if (typeof arg === 'number') {
      // int
      pushInt({
        bufferAddress: addressOfArg(i),
        type: arg
      })
    } else {
      // struct
      if (isPrimitiveStruct(arg)) {
        // primitive struct
        if (isFloatStruct(arg)) {
          pushFloat({
            bufferAddress: addressOfArg(i),
            type: primitiveStructToCFloatType(arg)
          })
        } else {
          pushInt({
            bufferAddress: addressOfArg(i),
            type: primitiveStructToCIntType(arg)
          })
        }
      } else {
        const divide = tryStructDivide(arg)
        let canPut = false
        if (divide) {
          // TODO: cover test case
          if (divide.every(t => t === ArgTarget.int)) {
            canPut = intRegArgs.length <= ARG_REG_INT.length - 2
          } else if (divide.every(t => t === ArgTarget.sse)) {
            canPut = floatRegArgs.length <= ARG_REG_FLOAT.length - 2
          } else {
            canPut = intRegArgs.length <= ARG_REG_INT.length - 1 &&
                      floatRegArgs.length <= ARG_REG_FLOAT.length - 1
          }
        }
        if (divide && canPut) {
          // struct as two 8 bytes
          if (divide[0] === ArgTarget.int) {
            pushInt({
              bufferAddress: addressOfArg(i),
              type: CType.i64
            })
          } else {
            pushFloat({
              bufferAddress: addressOfArg(i),
              type: CType.f64
            })
          }
          if (divide[1] === ArgTarget.int) {
            pushInt({
              bufferAddress: addressOfArg(i) + 8n,
              type: CType.i64
            })
          } else {
            pushFloat({
              bufferAddress: addressOfArg(i) + 8n,
              type: CType.f64
            })
          }
        } else {
          // struct as ptr
          pushStack({
            bufferAddress: addressOfArg(i),
            type: CType.void, // noop
            size: arg.size
          })
        }
      }
    }
  }

  return {
    intRegArgs,
    floatRegArgs,
    stackArgs,
  }
}