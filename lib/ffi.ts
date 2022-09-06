import { Win64InvokerBuilder } from "./assembler/win64_invoker"
import { CType, NativeType, NativeValue, TypeMap } from "./c_types"
import { getSymbol } from "./utils"
import bindings from 'bindings'
import { Win64CallbackBuilder } from "./assembler/win64_callback"
import { SystemVInvokerBuilder } from "./assembler/sysv_invoker"
import { SystemVCallbackBuilder } from "./assembler/sysv_callback"
import { InvokerBuilder } from "./assembler/invoker"

const addon = bindings('jitffi')

export interface CFunction {
  name: string,
  arguments: NativeType[],
  return: NativeType,
  module?: string
}
  
export type FunctionExt<T> = { ptr: Buffer, rawFunction: T }

type NativeInvoker<T extends CFunction> = (...args: unknown[]) => NativeValue<T['return']>

const noop = () => {}
export function createFunction<T extends CFunction>(decl: T): NativeInvoker<T> & FunctionExt<T> {
  let symbolPtr: Buffer
  let fn: Function
  let builder: InvokerBuilder

  return new Proxy(noop, {
    apply(_target, _thisArg, argArray) {
      if (!fn) {
        symbolPtr = getSymbol(decl.module, decl.name)
        builder = new (process.platform === 'win32' ? Win64InvokerBuilder : SystemVInvokerBuilder)(
          decl.return,
          decl.arguments,
          symbolPtr.readBigInt64()
        )
        const code = builder.build()
        
        const ptr = addon.getExecutablePointer(code)
        fn = addon.makeJSFunction(ptr, decl.name)
      }
      argArray.forEach((arg, i) => {
        builder.data[`a${i}`] = arg
      })
      fn()
      if (builder.data.ret instanceof Buffer) {
        return Buffer.from(builder.data.ret)
      } else {
        return builder.data.ret
      }
    },
    get(_target, p, _receiver) {
      switch (p) {
        case 'ptr': {
          return symbolPtr
        }
        case 'rawFunction': {
          return fn
        }
      }
    },
  }) as NativeInvoker<T> & FunctionExt<T>
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