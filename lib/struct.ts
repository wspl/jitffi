import { CType, CTypeSize, NativeValue } from "./c_types"

const getterSetterMap = {
  [CType.ptr]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.slice(offset, offset + CTypeSize[CType.ptr])
    },
    set(this: Struct<any>, buf: Buffer) {
      buf.copy(this._buffer, offset, 0, CTypeSize[CType.ptr])
    }
  }),
  [CType.u64]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readBigUInt64(offset)
    },
    set(this: Struct<any>, v: bigint) {
      this._buffer.writeBigUInt64(v, offset)
    }
  }),
  [CType.i64]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readBigInt64(offset)
    },
    set(this: Struct<any>, v: bigint) {
      this._buffer.writeBigInt64(v, offset)
    }
  }),
  [CType.u32]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readUInt32(offset)
    },
    set(this: Struct<any>, v: number) {
      this._buffer.writeUInt32(v, offset)
    }
  }),
  [CType.i32]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readInt32(offset)
    },
    set(this: Struct<any>, v: number) {
      this._buffer.writeInt32(v, offset)
    }
  }),
  [CType.u16]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readUInt16(offset)
    },
    set(this: Struct<any>, v: number) {
      this._buffer.writeUInt16(v, offset)
    }
  }),
  [CType.i16]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readInt16(offset)
    },
    set(this: Struct<any>, v: number) {
      this._buffer.writeInt16(v, offset)
    }
  }),
  [CType.u8]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readUInt8(offset)
    },
    set(this: Struct<any>, v: number) {
      this._buffer.writeUInt8(v, offset)
    }
  }),
  [CType.i8]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readInt8(offset)
    },
    set(this: Struct<any>, v: number) {
      this._buffer.writeInt8(v, offset)
    }
  }),
  [CType.f64]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readDouble(offset)
    },
    set(this: Struct<any>, v: number) {
      this._buffer.writeDouble(v, offset)
    }
  }),
  [CType.f32]: (offset: number) => ({
    get(this: Struct<any>) {
      return this._buffer.readFloat(offset)
    },
    set(this: Struct<any>, v: number) {
      this._buffer.writeFloat(v, offset)
    }
  }),
  [CType.void]: (offset: number) => ({
    get(this: Struct<any>) {
      return undefined
    },
    set(this: Struct<any>, v: undefined) {}
  })
}
const structGetterSetter = <T extends StructDeclareBase>(offset: number) => ({
  get(this: Struct<T>) {
    const s = this._subStruct.get(offset)
    if (s) {
      return s
    } else {
      const proto = Object.getPrototypeOf(this).constructor
      const creator = proto.subStructCreatorMap.get(offset)
      const s = Object.setPrototypeOf({
        _buffer: this._buffer.slice(offset, offset + creator.size),
        _subStruct: new Map()
      }, creator.prototype)
      this._subStruct.set(offset, s)
      return s
    }
  },
  set(this: Struct<T>, buf: Struct<T>) {
    this._subStruct.set(offset, buf._mergeInto(this, offset))
  }
})

type StructDeclareBase = { [key: string]: CType | StructCreator<any> }
type StructObject<T extends StructDeclareBase> = { [K in keyof T]: NativeValue<T[K]> }

export interface StructContent<T extends StructDeclareBase> {
  _buffer: Buffer
  _subStruct: Map<number, Struct<any>>
  clone(): Struct<T>
  pointer(): Buffer
  raw(): Buffer
  _mergeInto(into: Struct<any>, offset: number): Struct<T>
}

export type Struct<T extends StructDeclareBase> = StructObject<T> & StructContent<T>

export interface StructCreator<T extends StructDeclareBase> {
  new (initialValue?: Partial<StructObject<T>>): Struct<T>
  args: T
  alignment: number
  size: number
  offsetMap: Record<string, number>
  subStructCreatorMap: Map<number, StructCreator<any>>
}

export function defineStruct<T extends StructDeclareBase>(args: T): StructCreator<T> {
  const Struct = function(this: Struct<T>, initialValue: Partial<StructObject<T>>) {
    this._buffer = Buffer.alloc(Struct.size);
    this._subStruct = new Map()

    if (initialValue) {
      for (const [key, value] of Object.entries(initialValue)) {
        (this as any)[key] = value
      }
    }
  } as never as StructCreator<T>
  
  Struct.args = args
  Struct.alignment = Math.max(...Object.values(args).map(t => typeof t === 'number' ? CTypeSize[t] : t.alignment))

  Struct.subStructCreatorMap = new Map()

  // calculate field alignment
  const offsetMap: Record<string, number> = {}
  let offset = 0
  const getNextOffset = () => offset - offset % Struct.alignment + Struct.alignment

  for (const [key, type] of Object.entries(args)) {
    const nextOffset = getNextOffset()
    const size = typeof type === 'number' ? CTypeSize[type] : type.size

    if (offset !== 0 && offset + size > nextOffset) {
      offsetMap[key] = nextOffset
      offset = nextOffset + size
    } else {
      offsetMap[key] = offset
      offset += size
    }

    if (typeof type !== 'number') {
      Struct.subStructCreatorMap.set(offsetMap[key], type)
    }
  }

  const nextOffset = getNextOffset()
  Struct.size = offset % Struct.alignment === 0 ? offset : nextOffset
  Struct.offsetMap = offsetMap

  for (const [key, type] of Object.entries(args)) {
    const descriptor: PropertyDescriptor = {
      enumerable: true,
      configurable: false
    }

    if (typeof type === 'number') {
      const { get, set } = getterSetterMap[type](offsetMap[key])
      descriptor.get = get
      descriptor.set = set
    } else {
      const { get, set } = structGetterSetter(offsetMap[key])
      descriptor.get = get
      descriptor.set = set
    }
    Object.defineProperty(Struct.prototype, key, descriptor)
  }

  Struct.prototype.clone = function(this: Struct<T>) {
    const buffer = Buffer.alloc(Struct.size)
    this._buffer.copy(buffer)

    const subStruct = new Map()
    for (const [key, value] of this._subStruct.entries()) {
      subStruct.set(key, value.clone())
    }
    return Object.setPrototypeOf({
      _buffer: buffer,
      _subStruct: subStruct
    }, Struct.prototype)
  }

  Struct.prototype._mergeInto = function(this: Struct<T>, into: Struct<any>, offset: number): Struct<T> {
    this._buffer.copy(into._buffer, offset, 0, this._buffer.length)

    const subStruct = new Map()
    for (const [key, value] of this._subStruct.entries()) {
      subStruct.set(key, value.clone())
    }
    return Object.setPrototypeOf({
      _buffer: into._buffer.slice(offset, offset + Struct.size),
      _subStruct: subStruct
    }, Struct.prototype)
  }

  Struct.prototype.pointer = function(this: Struct<T>): Buffer {
    return this._buffer.pointer()
  }

  Struct.prototype.raw = function(this: Struct<T>): Buffer {
    return this._buffer
  }

  return Struct
}