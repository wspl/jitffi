import bindings from 'bindings'
const addon = bindings('jitffi')

Buffer.prototype.writeBigInt64 = addon.isLittleEndian ? Buffer.prototype.writeBigInt64LE : Buffer.prototype.writeBigInt64BE
Buffer.prototype.readBigInt64 = addon.isLittleEndian ? Buffer.prototype.readBigInt64LE : Buffer.prototype.readBigInt64B
Buffer.prototype.writeBigUInt64 = addon.isLittleEndian ? Buffer.prototype.writeBigUInt64LE : Buffer.prototype.writeBigUInt64BE
Buffer.prototype.readBigUInt64 = addon.isLittleEndian ? Buffer.prototype.readBigUInt64LE : Buffer.prototype.readBigUInt64B
Buffer.prototype.writeInt32 = addon.isLittleEndian ? Buffer.prototype.writeInt32LE : Buffer.prototype.writeInt32BE
Buffer.prototype.readInt32 = addon.isLittleEndian ? Buffer.prototype.readInt32LE : Buffer.prototype.readInt32B
Buffer.prototype.writeUInt32 = addon.isLittleEndian ? Buffer.prototype.writeUInt32LE : Buffer.prototype.writeUInt32BE
Buffer.prototype.readUInt32 = addon.isLittleEndian ? Buffer.prototype.readUInt32LE : Buffer.prototype.readUInt32B
Buffer.prototype.writeInt16 = addon.isLittleEndian ? Buffer.prototype.writeInt16LE : Buffer.prototype.writeInt16BE
Buffer.prototype.readInt16 = addon.isLittleEndian ? Buffer.prototype.readInt16LE : Buffer.prototype.readInt16B
Buffer.prototype.writeUInt16 = addon.isLittleEndian ? Buffer.prototype.writeUInt16LE : Buffer.prototype.writeUInt16BE
Buffer.prototype.readUInt16 = addon.isLittleEndian ? Buffer.prototype.readUInt16LE : Buffer.prototype.readUInt16B

Buffer.prototype.writeDouble = addon.isLittleEndian ? Buffer.prototype.writeDoubleLE : Buffer.prototype.writeDoubleBE
Buffer.prototype.readDouble = addon.isLittleEndian ? Buffer.prototype.readDoubleLE : Buffer.prototype.readDoubleBE
Buffer.prototype.writeFloat = addon.isLittleEndian ? Buffer.prototype.writeFloatLE : Buffer.prototype.writeFloatBE
Buffer.prototype.readFloat = addon.isLittleEndian ? Buffer.prototype.readFloatLE : Buffer.prototype.readFloatBE

Buffer.prototype.pointer = function() {
  return addon.getBufferPointer(this)
}

export {}

declare module 'buffer' {
  interface Buffer {
    writeBigInt64(value: bigint, offset?: number): number;
    writeBigUInt64(value: bigint, offset?: number): number;
    readBigInt64(offset?: number): bigint;
    readBigUInt64(offset?: number): bigint;
    writeInt32(value: number, offset?: number): number;
    writeUInt32(value: number, offset?: number): number;
    readInt32(offset?: number): number;
    readUInt32(offset?: number): number;
    writeInt16(value: number, offset?: number): number;
    writeUInt16(value: number, offset?: number): number;
    readInt16(offset?: number): number;
    readUInt16(offset?: number): number;
    writeDouble(value: number, offset?: number): number;
    writeFloat(value: number, offset?: number): number;
    readDouble(offset?: number): number;
    readFloat(offset?: number): number;
    pointer(): Buffer;
  }
}