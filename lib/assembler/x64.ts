import '../buffer_ext'
import bindings from 'bindings'
const addon = bindings('jitffi')

export enum Reg64 {
  rax = 0b000,
  rcx = 0b001,
  rdx = 0b010,
  rbx = 0b011,
  rsp = 0b100,
  rbp = 0b101,
  rsi = 0b110,
  rdi = 0b111,

  r8 = 0b1000,
  r9 = 0b1001,
  r10 = 0b1010,
  r11 = 0b1011,
  r12 = 0b1100,
  r13 = 0b1101,
  r14 = 0b1110,
  r15 = 0b1111,

  xmm0 = 0b10000,
  xmm1 = 0b10001,
  xmm2 = 0b10010,
  xmm3 = 0b10011,
  xmm4 = 0b10100,
  xmm5 = 0b10101,
  xmm6 = 0b10110,
  xmm7 = 0b10111,

  xmm8 = 0b11000,
  xmm9 = 0b11001,
  xmm10 = 0b11010,
  xmm11 = 0b11011,
  xmm12 = 0b11100,
  xmm13 = 0b11101,
  xmm14 = 0b11110,
  xmm15 = 0b11111,
}

export class X64Assembler {
  buffer = Buffer.alloc(1024)
  cursor = 0

  writeREXPrefix({ zero, w, r, b }: { zero?: boolean | number, w?: boolean | number, r?: boolean | number, b?: boolean | number }) {
    let rex = 0
    if (w) {
      rex |= 0b1000
    }
    if (r) {
      rex |= 0b0100
    }
    if (b) {
      rex |= 0b0001
    }
    if (rex || zero) {
      rex |= 0b01000000
      this.write8bit(rex)
    }
  }

  writeVariadic({ r, rm, disp }: { r: Reg64, rm?: Reg64, disp?: number }) {
    const hasRsp = r === Reg64.rsp || rm === Reg64.rsp

    let modRM = 0
    modRM |= (disp ? (disp < 128 ? 0b01 : 0b10) : 0) << 6
    modRM |= (r & 0b111) << 3
    modRM |= hasRsp ? 0b100 : ((rm ?? 0b100) & 0b111);
    this.write8bit(modRM)

    if (hasRsp) {
      // always base=rsp/scale=0/index=0
      let sib = 0x24
      this.write8bit(sib)
    }

    if (disp) {
      if (disp < 128) {
        this.write8bit(disp)
      } else {
        this.write32bit(disp)
      }
    }
  }

  writeRegRegOpcodeModRM(r1: Reg64, r2: Reg64) {
    let modRM = 0
    modRM |= 0b11 << 6
    modRM |= r1 << 3
    modRM |= r2;
    this.write8bit(modRM)
  }

  write8bit(...bs: number[]) {
    for (const b of bs) {
      this.buffer[this.cursor] = b
      this.cursor += 1
    }
  }

  write32bit(...dws: number[]) {
    for (const dw of dws) {
      this.buffer.writeUInt32LE(dw, this.cursor)
      this.cursor += 4
    }
  }

  write64bit(...dws: bigint[]) {
    for (const dw of dws) {
      this.buffer.writeBigUInt64LE(dw, this.cursor)
      this.cursor += 8
    }
  }

  ret() {
    this.write8bit(0xc3)
  }


  push(a1: OpReg) {
    this.writeREXPrefix({ r: a1.r & 0b1000 })
    this.write8bit(0x50 + (a1.r & 0b111))
  }

  pop(a1: OpReg) {
    this.writeREXPrefix({ r: a1.r & 0b1000 })
    this.write8bit(0x58 + (a1.r & 0b111))
  }

  add(a1: OpReg, a2: OpReg | OpImmAuto | OpMem) {
    if ('r' in a1 && 'r' in a2) {
      this.writeREXPrefix({ w: true, r: a1.r & 0b1000, b: a2.r & 0b1000 })
      this.write8bit(0x03)
      this.writeRegRegOpcodeModRM(a1.r, a2.r)
    } else if ('r' in a1 && 'rm' in a2) {
      this.writeREXPrefix({ w: true, r: a1.r & 0b1000, b: a2.rm & 0b1000 })
      this.write8bit(0x03)
      this.writeVariadic({
        r: a1.r,
        rm: a2.rm,
        disp: a2.disp
      })
    } else if ('r' in a1 && 'n' in a2) {
      this.writeREXPrefix({ w: true, b: 0b1000 & a1.r })
      if (a2.n < 128) {
        this.write8bit(0x83)
      } else {
        this.write8bit(0x81)
      }
      this.writeRegRegOpcodeModRM(0, a1.r)
      if (a2.n < 128) {
        this.write8bit(a2.n)
      } else {
        this.write64bit(BigInt(a2.n))
      }
    } else {
      throw 'illegal operation'
    }
  }

  sub(a1: OpReg, a2: OpReg | OpImmAuto | OpMem) {
    if ('r' in a1 && 'r' in a2) {
      this.writeREXPrefix({ w: true, r: a1.r & 0b1000, b: a2.r & 0b1000 })
      this.write8bit(0x2b)
      this.writeRegRegOpcodeModRM(a1.r, a2.r)
    } else if ('r' in a1 && 'rm' in a2) {
      this.writeREXPrefix({ w: true, r: a1.r & 0b1000, b: a2.rm & 0b1000 })
      this.write8bit(0x2b)
      this.writeVariadic({
        r: a1.r,
        rm: a2.rm,
        disp: a2.disp
      })
    } else if ('r' in a1 && 'n' in a2) {
      this.writeREXPrefix({ w: true, b: 0b1000 & a1.r })
      if (a2.n < 128) {
        this.write8bit(0x83)
      } else {
        this.write8bit(0x81)
      }
      this.writeRegRegOpcodeModRM(5, a1.r)
      if (a2.n < 128) {
        this.write8bit(a2.n)
      } else {
        this.write64bit(BigInt(a2.n))
      }
    } else {
      throw 'illegal operation'
    }
  }

  mov(a1: OpReg | OpMem, a2: OpReg | OpMem | OpImm64, { bit = 64 } : { bit?: 64 | 32 | 16 | 8 } = {}) {
    if ('r' in a1 && 'r' in a2) {
      if (bit !== 64) {
        throw 'illegal operation'
      }
      this.writeREXPrefix({ w: true, r: a1.r & 0b1000, b: a2.r & 0b1000 }) 
      this.write8bit(0x8b)
      this.writeRegRegOpcodeModRM(a1.r, a2.r)
    } else if ('r' in a1 && 'rm' in a2) {
      if (bit === 64) {
        this.writeREXPrefix({ w: true, r: a1.r & 0b1000, b: a2.rm & 0b1000 })
        this.write8bit(0x8b)
      } else if (bit === 32) {
        this.writeREXPrefix({ r: a1.r & 0b1000, b: a2.rm & 0b1000 })
        this.write8bit(0x8b)
      } else if (bit === 16) {
        this.write8bit(0x66)
        this.writeREXPrefix({ r: a1.r & 0b1000, b: a2.rm & 0b1000 })
        this.write8bit(0x8b)
      } else if (bit === 8) {
        this.writeREXPrefix({ zero: a1.r & 0b100, r: a1.r & 0b1000, b: a2.rm & 0b1000 })
        this.write8bit(0x8a)
      }
      this.writeVariadic({
        r: a1.r,
        rm: a2.rm,
        disp: a2.disp
      })
    } else if ('rm' in a1 && 'r' in a2) {
      if (bit === 64) {
        this.writeREXPrefix({ w: true, r: a2.r & 0b1000, b: a1.rm & 0b1000 })
        this.write8bit(0x89)
      } else if (bit === 32) {
        this.writeREXPrefix({ r: a2.r & 0b1000, b: a1.rm & 0b1000 })
        this.write8bit(0x89)
      } else if (bit === 16) {
        this.write8bit(0x66)
        this.writeREXPrefix({ r: a2.r & 0b1000, b: a1.rm & 0b1000 })
        this.write8bit(0x89)
      } else if (bit === 8) {
        this.writeREXPrefix({ zero: a2.r & 0b100, r: a2.r & 0b1000, b: a1.rm & 0b1000 })
        this.write8bit(0x88)
      }
      this.writeVariadic({
        r: a2.r,
        rm: a1.rm,
        disp: a1.disp
      })
    } else if ('r' in a1 && 'i64' in a2) {
      if (bit !== 64) {
        throw 'illegal operation'
      }
      this.writeREXPrefix({ w: true, b: 0b1000 & a1.r })
      this.write8bit(0xb8 + (0b111 & a1.r))
      this.write64bit(a2.i64) 
    } else {
      throw 'illegal operation'
    }
  }

  movzx(a1: OpReg, a2: OpMem, { bit } : { bit: 16 | 8 }) {
    this.writeREXPrefix({ r: 0b1000 & a1.r, b: 0b1000 & a2.rm })
    this.write8bit(0x0f)
    if (bit === 8) {
      this.write8bit(0xb6)
    } else if (bit === 16) {
      this.write8bit(0xb7)
    }
    this.writeVariadic({
      r: a1.r,
      rm: a2.rm,
      disp: a2.disp
    })
  }

  movsd(a1: OpReg | OpMem, a2: OpReg | OpMem) {
    if ('r' in a1 && 'rm' in a2) {
      this.write8bit(0xf2)
      this.writeREXPrefix({ r: a1.r & 0b1000, b: a2.rm & 0b1000 })
      this.write8bit(0x0f, 0x10)
      this.writeVariadic({
        r: a1.r,
        rm: a2.rm,
        disp: a2.disp
      })
    } else if ('rm' in a1 && 'r' in a2) {
      this.write8bit(0xf2)
      this.writeREXPrefix({ r: a2.r & 0b1000, b: a1.rm & 0b1000 })
      this.write8bit(0x0f, 0x11)
      this.writeVariadic({
        r: a2.r,
        rm: a1.rm,
        disp: a1.disp
      })
    } else {
      throw 'illegal operation'
    }
  }

  movss(a1: OpReg | OpMem, a2: OpReg | OpMem) {
    if ('r' in a1 && 'rm' in a2) {
      this.write8bit(0xf3)
      this.writeREXPrefix({ r: a1.r & 0b1000, b: a2.rm & 0b1000 })
      this.write8bit(0x0f, 0x10)
      this.writeVariadic({
        r: a1.r,
        rm: a2.rm,
        disp: a2.disp
      })
    } else if ('rm' in a1 && 'r' in a2) {
      this.write8bit(0xf3)
      this.writeREXPrefix({ r: a2.r & 0b1000, b: a1.rm & 0b1000 })
      this.write8bit(0x0f, 0x11)
      this.writeVariadic({
        r: a2.r,
        rm: a1.rm,
        disp: a1.disp
      })
    } else {
      throw 'illegal operation'
    }
  }

  call(a1: OpReg) {
    this.write8bit(0xff)
    this.writeRegRegOpcodeModRM(2, a1.r)
  }

  xor(a1: OpReg, a2: OpReg) {
    this.write8bit(0x33)
    this.writeRegRegOpcodeModRM(a1.r, a2.r)
  }

  brk() {
    this.write8bit(0xcc)
  }

  finish(): Buffer {
    return this.buffer.slice(0, this.cursor)
  }
}

interface OpReg {
  r: Reg64,
}
interface OpMem {
  rm: Reg64,
  disp?: number
}
interface OpImmAuto {
  n: number
}
interface OpImm64 {
  i64: bigint
}


export function align16(n: number) {
  if (n % 16 > 0) {
    return Math.ceil(n / 16) * 16;
  } else {
    return n
  }
}


export function align8(n: number) {
  if (n % 8 > 0) {
    return Math.ceil(n / 8) * 8;
  } else {
    return n
  }
}

// console.log(addon.getPrintf())

// const asm = new X64Assembler()

// const text = Buffer.from('hello\0')
// asm.mov({ rm: Reg64.rsp, disp: 16 }, { r: Reg64.rdx })
// asm.mov({ rm: Reg64.rsp, disp: 8 }, { r: Reg64.rcx })
// asm.sub({ r: Reg64.rsp }, { i8: 40 })
// asm.mov({ r: Reg64.rcx }, { i64: text.pointer().readBigInt64() })
// asm.mov({ r: Reg64.rax }, { i64: addon.getPrintf().readBigInt64() })
// asm.call({ r: Reg64.rax })
// asm.xor({ r: Reg64.rax }, { r: Reg64.rax })
// asm.add({ r: Reg64.rsp }, { i8: 40 })
// asm.ret()
// asm.movsx({ r: Reg64.rax }, { rm: Reg64.rsp }, { bit: 16 })
// console.log(asm.finish())
// const code = asm.finish()

// const ptr = addon.getExecutablePointer(code)
// const fn = addon.makeJSFunction(ptr, 'fn')

// console.log(code, ptr, fn)
// console.log(fn())