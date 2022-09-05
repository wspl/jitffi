import { defineStruct, Struct, StructCreator } from "../struct";
import { NativeType } from "../c_types";

export abstract class InvokerBuilder {
  creator: StructCreator<any>
  data: Struct<any>

  constructor(
    public ret: NativeType,
    public args: NativeType[],
    public calleePtr: bigint
  ) {
    this.creator = defineStruct({
      ret,
      ...Object.fromEntries(args.map((arg, i) => [`a${i}`, arg]))
    })
    this.data = new this.creator()
  }

  abstract build(): void;

  bufferAddress() {
    return this.data.pointer().readBigInt64()
  }

  addressOfArg(i: number) {
    return this.bufferAddress() + BigInt(this.creator.offsetMap[`a${i}`])
  }
}