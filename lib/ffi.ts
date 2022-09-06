import { Win64InvokerBuilder } from "./assembler/win64_invoker"
import { NativeType } from "./c_types"
import { getSymbol } from "./utils"
import bindings from 'bindings'
import { CallbackBuilder } from "./assembler/callback"
import { Win64CallbackBuilder } from "./assembler/win64_callback"
import { SystemVInvokerBuilder } from "./assembler/sysv_invoker"
import fs from 'fs'
import { execSync } from "child_process"
import { SystemVCallbackBuilder } from "./assembler/sysv_callback"

const addon = bindings('jitffi')

export interface CFunction {
  name: string,
  arguments: NativeType[],
  return: NativeType,
  module?: string
}
  
export type FunctionExt<T> = { ptr: Buffer, rawFunction: T }

export function createFunction<T extends Function = Function>(decl: CFunction): T & FunctionExt<T> {
  const fnPtr = getSymbol(decl.module, decl.name)
  const builder = new (process.platform === 'win32' ? Win64InvokerBuilder : SystemVInvokerBuilder)(
    decl.return,
    decl.arguments,
    fnPtr.readBigInt64()
  )
  const code = builder.build()
  const ptr = addon.getExecutablePointer(code)
  const fn = addon.makeJSFunction(ptr, decl.name)
  const f = ((...args: any[]) => {
    args.forEach((arg, i) => {
      builder.data[`a${i}`] = arg
    })
    fn()
    return Buffer.from(builder.data.ret)
  }) as never as T & FunctionExt<T>
  f.ptr = fnPtr
  f.rawFunction = fn
  return f;
}

export interface CallbackCreator<T> {
  create: (fn: T) => Buffer
}

export function createCallbackCreator<T extends Function = Function>(decl: CFunction): CallbackCreator<T> {
  return {
    create: (fn) => {
      const builder = new (process.platform === 'win32' ? Win64CallbackBuilder : SystemVCallbackBuilder)(
        decl.return,
        decl.arguments,
        (data) => {
          const ret = fn(...decl.arguments.map((_, i) => data[`a${i}`]))
          data.ret = ret
        }
      )
      const code = builder.build()
      const ptr = addon.getExecutablePointer(code)
      return ptr
    }
  }
}