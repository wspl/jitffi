import { CType, NativeType } from "../c_types";
import { align16, Reg64, X64Assembler } from "./x64";
import fs from 'fs'
import { execSync } from "child_process";
import bindings from 'bindings'
import { InvokerBuilder } from "./invoker";
import { defineStruct } from "../struct";
import { ARG_REG_FLOAT, ARG_REG_INT, PRIMITIVE_SIZE } from "./win64";
const addon = bindings('jitffi')

export class Win64InvokerBuilder extends InvokerBuilder {
  addressOfArg(i: number) {
    if (this.retAsArg0()) {
      if (i === 0) {
        throw 'should get address of return reference via addressOfArg'
      } else {
        return super.addressOfArg(i - 1)
      }
    } else {
      return super.addressOfArg(i)
    }
  }

  retAsArg0()  {
    return typeof this.ret !== 'number' && !PRIMITIVE_SIZE.includes(this.ret.size)
  }

  build() {
    const args = [...this.args]
    if (this.retAsArg0()) {
      args.unshift(this.ret)
    }

    // simplify stack size calculation:
    // |                     |     callee addr     |
    // |         arg0        |         arg1        |
    // |         arg2        |         arg3        |
    // |         arg4        | align padding space |
    // | fixed padding space |       fn addr       |
    const stackPadding = 8
    const stackForArguments = align16((args.length > 4 ? args.length : 4) * 8)

    const asm = new X64Assembler()
    
    // sub rsp to before of callee
    const stackStart = stackPadding + stackForArguments
    asm.sub({ r: Reg64.rsp }, { n: stackStart })

    // mov first 4 args to reg
    // mov addr to rax
    for (let i = 0; i < args.length && i < 4; i++) {
      let arg = args[i]
      
      if (this.retAsArg0() && i === 0) {
        // value should pass address
        asm.mov({ r: ARG_REG_INT[i] }, { i64: this.bufferAddress() }, { bit: 64 })
        continue
      }

      if (typeof arg !== 'number') {
        if (PRIMITIVE_SIZE.includes(arg.size)) {
          // value should deref, mapping to CType
          switch (arg.size) {
            case 1: {
              arg = CType.i8
            }
            case 2: {
              arg = CType.i16
            }
            case 4: {
              arg = CType.i32
            }
            case 8: {
              arg = CType.i64
            }
          }
        } else {
          // value should pass address
          asm.mov({ r: ARG_REG_INT[i] }, { i64: this.addressOfArg(i) })
          continue
        }
      }

      // value should deref
      asm.mov({ r: Reg64.rax }, { i64: this.addressOfArg(i) });
      switch(arg) {
        case CType.i8:
        case CType.u8: {
          asm.movzx({ r: ARG_REG_INT[i] }, { rm: Reg64.rax }, { bit: 8 })
          break
        }
        case CType.i16:
        case CType.u16: {
          asm.movzx({ r: ARG_REG_INT[i] }, { rm: Reg64.rax }, { bit: 16 })
          break
        }
        case CType.i32:
        case CType.u32: {
          asm.mov({ r: ARG_REG_INT[i] }, { rm: Reg64.rax }, { bit: 32 })
          break
        }
        case CType.ptr:
        case CType.i64:
        case CType.u64: {
          asm.mov({ r: ARG_REG_INT[i] }, { rm: Reg64.rax }, { bit: 64 })
          break
        }
        case CType.f32: {
          asm.movss({ r: ARG_REG_FLOAT[i] }, { rm: Reg64.rax })
          break
        }
        case CType.f64: {
          asm.movsd({ r: ARG_REG_FLOAT[i] }, { rm: Reg64.rax })
          // asm.brk()
          break
        }
        default: {
          throw 'unknown type'
        }
      }
    }
    // mov the remaining args
    for (let i = 4; i < args.length; i++) {
      let arg = args[i]

      if (typeof arg !== 'number') {
        if (PRIMITIVE_SIZE.includes(arg.size)) {
          // value should deref, mapping to CType
          switch (arg.size) {
            case 1: {
              arg = CType.i8
            }
            case 2: {
              arg = CType.i16
            }
            case 4: {
              arg = CType.i32
            }
            case 8: {
              arg = CType.i64
            }
          }
        } else {
          // value should pass address
          // TODO: add test case for this situation
          asm.mov({ r: Reg64.rax }, { i64: this.addressOfArg(i) })
          asm.mov({ rm: Reg64.rsp, disp: i * 8 }, { r: Reg64.rax })
          continue
        }
      }

      asm.mov({ r: Reg64.rax }, { i64: this.addressOfArg(i) });
      switch(arg) {
        case CType.i8:
        case CType.u8: {
          asm.movzx({ r: Reg64.r10 }, { rm: Reg64.rax }, { bit: 8 })
          asm.mov({ rm: Reg64.rsp, disp: i * 8 }, { r: Reg64.r10 })
          break
        }
        case CType.i16:
        case CType.u16: {
          asm.movzx({ r: Reg64.r10 }, { rm: Reg64.rax }, { bit: 16 })
          asm.mov({ rm: Reg64.rsp, disp: i * 8 }, { r: Reg64.r10 })
          break
        }
        case CType.i32:
        case CType.u32:
        case CType.f32: {
          asm.mov({ r: Reg64.r10 }, { rm: Reg64.rax }, { bit: 32 })
          asm.mov({ rm: Reg64.rsp, disp: i * 8 }, { r: Reg64.r10 }, { bit: 32 })
          break
        }
        case CType.ptr:
        case CType.i64:
        case CType.u64:
        case CType.f64: {
          asm.mov({ r: Reg64.r10 }, { rm: Reg64.rax }, { bit: 64 })
          asm.mov({ rm: Reg64.rsp, disp: i * 8 }, { r: Reg64.r10 }, { bit: 64 })
          break
        }
        default: {
          throw 'unknown type'
        }
      }
    }

    // call
    asm.mov({ r: Reg64.rax }, { i64: this.calleePtr })

    // asm.brk()

    asm.call({ r: Reg64.rax })

    // asm.brk()

    // write ret to buffer
    if (!this.retAsArg0()) {
      asm.mov({ r: Reg64.r10 }, { i64: this.bufferAddress() });
      let ret = this.ret

      if (typeof ret !== 'number' && PRIMITIVE_SIZE.includes(ret.size)) {
        // primitive size struct should mapping to CType
        switch (ret.size) {
          case 1: {
            ret = CType.i8
          }
          case 2: {
            ret = CType.i16
          }
          case 4: {
            ret = CType.i32
          }
          case 8: {
            ret = CType.i64
          }
        }
      }

      switch(ret) {
        case CType.i8:
        case CType.u8: {
          asm.mov({ rm: Reg64.r10 }, { r: Reg64.rax }, { bit: 8 })
          break
        }
        case CType.i16:
        case CType.u16: {
          asm.mov({ rm: Reg64.r10 }, { r: Reg64.rax }, { bit: 16 })
          break
        }
        case CType.i32:
        case CType.u32: {
          asm.mov({ rm: Reg64.r10 }, { r: Reg64.rax }, { bit: 32 })
          break
        }
        case CType.ptr:
        case CType.i64:
        case CType.u64: {
          asm.mov({ rm: Reg64.r10 }, { r: Reg64.rax }, { bit: 64 })
          break
        }
        case CType.f32: {
          // asm.brk()
          asm.movss({ rm: Reg64.r10 }, { r: Reg64.xmm0 })
          break
        }
        case CType.f64: {
          asm.movsd({ rm: Reg64.r10 }, { r: Reg64.xmm0 })
          break
        }
        case CType.void: {
          break
        }
        default: {
          throw `unknown type: ${ret}`
        }
      }
    }

    // add rsp to caller head
    asm.add({ r: Reg64.rsp }, { n: stackStart })

    // ret zero
    asm.xor({ r: Reg64.rax }, { r: Reg64.rax })

    asm.ret()

    return asm.finish()
  }
}

// const stru1 = defineStruct({
//   a: CType.i32
// })

// const stru2 = defineStruct({
//   a: CType.i8,
//   b: CType.i64
// })

// const builder = new Win64InvokerBuilder(
//   stru2,
//   [CType.i64, stru1, stru2, CType.f64, CType.f32, CType.i16],
//   addon.getExampleExtFn().readBigInt64()
// )

// const code = builder.build()

// fs.writeFileSync('./a', code)
// execSync('objdump -D --target=binary --architecture i386:x86-64:intel a', { stdio: 'inherit' })

// const data = builder.data as any;
// data.a0 = 12345678910123n
// data.a1 = new stru1({
//   a: 321321321
// })
// data.a2 = new stru2({
//   a: 123,
//   b: 32132132222222n
// })
// data.a3 = 3.1415926
// data.a4 = 192801.12
// data.a5 = 25500

// const ptr = addon.getExecutablePointer(code)
// const fn = addon.makeJSFunction(ptr, 'fn')

// console.log(builder.data._buffer)

// fn()

// console.log(builder.data.ret.a, builder.data.ret.b)