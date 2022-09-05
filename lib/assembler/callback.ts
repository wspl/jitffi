import { CTypeSize, NativeType } from "../c_types"
import { defineStruct, Struct, StructCreator } from "../struct"
import bindings from 'bindings'
const addon = bindings('jitffi')

export abstract class CallbackBuilder {
  creator: StructCreator<any>
  data: Struct<any>
  callbackReference: Buffer

  constructor(
    public ret: NativeType,
    public args: NativeType[],
    public callback: (data: Struct<any>) => void
  ) {
    this.creator = defineStruct({
      ret,
      ...Object.fromEntries(args.map((arg, i) => [`a${i}`, arg]))
    })
    this.data = new this.creator()

    this.callbackReference = addon.getCallbackReference(() => {
      this.callback(this.data) 
    })
  }

  abstract build(): Buffer;

  bufferAddress() {
    return this.data.pointer().readBigInt64()
  }

  addressOfArg(i: number) {
    return this.bufferAddress() + BigInt(this.creator.offsetMap[`a${i}`])
  }
}