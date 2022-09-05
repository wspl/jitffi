import { CallbackBuilder } from "./callback";
import { ARG_REG_FLOAT, ARG_REG_INT, PRIMITIVE_SIZE } from "./win64";
import bindings from 'bindings'
import { Reg64, X64Assembler } from "./x64";
import { CType, sizeOf } from "../c_types";
import fs from 'fs'
import { execSync } from "child_process";
const addon = bindings('jitffi')

export class Win64CallbackBuilder extends CallbackBuilder {
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

    const asm = new X64Assembler()
    // stack structure:
    // |                     |  call_callback addr |
    // |         arg0        |         arg1        |
    // |         arg2        |         arg3        |
    //                      or
    // |                     |      memcpy addr    |
    // |         arg0        |         arg1        |
    // |         arg2        |         arg3        |
    //                      and
    // |       padding       |    callback addr    |
    // |         arg0        |         arg1        |
    // |         arg2        |         arg3        |
    // |         arg4        |         arg5        |
    const stackOffset = 5 * 8
    asm.sub({ r: Reg64.rsp }, { n: stackOffset })

    // move first 4 args from reg to stack (fill ghost space)
    for (let i = 0; i < args.length && i < 4; i++) {
      const arg = args[i]
      switch (arg) {
        case CType.f32: {
          asm.movss({ rm: Reg64.rsp, disp: stackOffset + 8 + i * 8 }, { r: ARG_REG_FLOAT[i] })
          break
        }
        case CType.f64: {
          asm.movsd({ rm: Reg64.rsp, disp: stackOffset + 8 + i * 8 }, { r: ARG_REG_FLOAT[i] })
          break
        }
        default: {
          asm.mov({ rm: Reg64.rsp, disp: stackOffset + 8 + i * 8 }, { r: ARG_REG_INT[i] })
          break
        }
      }
    }

    // move all args from stack to buffer
    for (let i = 0; i < args.length; i++) {
      let arg = args[i]

      if (this.retAsArg0() && i === 0) {
        // skip of return pass as arg0
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
          // struct should copy from caller allocated stack memory
          asm.mov({ r: ARG_REG_INT[0] }, { i64: this.addressOfArg(i) })
          asm.mov({ r: ARG_REG_INT[1] }, { rm: Reg64.rsp, disp: stackOffset + 8 + i * 8 })
          asm.mov({ r: ARG_REG_INT[2] }, { i64: BigInt(sizeOf(arg)) })
          asm.mov({ r: Reg64.rax }, { i64: addon.memcpyPtr.readBigInt64() })
          asm.call({ r: Reg64.rax })
          continue
        }
      }

      // value should write to buffer directly
      // target: address of buffer with offset
      asm.mov({ r: Reg64.rax }, { i64: this.addressOfArg(i) });
      // source: address of stack
      asm.mov({ r: Reg64.r10 }, { rm: Reg64.rsp, disp: stackOffset + 8 + i * 8 });
      // do mov
      switch(arg) {
        case CType.i8:
        case CType.u8: {
          asm.mov({ rm: Reg64.rax }, { r: Reg64.r10 }, { bit: 8 })
          break
        }
        case CType.i16:
        case CType.u16: {
          asm.mov({ rm: Reg64.rax }, { r: Reg64.r10 }, { bit: 16 })
          break
        }
        case CType.i32:
        case CType.u32:
        case CType.f32: {
          asm.mov({ rm: Reg64.rax }, { r: Reg64.r10 }, { bit: 32 })
          break
        }
        case CType.ptr:
        case CType.i64:
        case CType.u64:
        case CType.f64: {
          asm.mov({ rm: Reg64.rax }, { r: Reg64.r10 }, { bit: 64 })
          break
        }
        default: {
          throw 'unknown type'
        }
      }
    }

    // invoke callback
    asm.mov({ r: ARG_REG_INT[0] }, { i64: addon.envPtr.readBigInt64() })
    asm.mov({ r: ARG_REG_INT[1] }, { i64: this.callbackReference.readBigInt64() })
    asm.mov({ r: Reg64.rax }, { i64: addon.callCallbackPtr.readBigInt64() })
    asm.call({ r: Reg64.rax })

    // process return value
    if (this.retAsArg0()) {
      // copy return value to arg0 address
      asm.mov({ r: ARG_REG_INT[0] }, { rm: Reg64.rsp, disp: stackOffset + 8 })
      asm.mov({ r: ARG_REG_INT[1] }, { i64: this.bufferAddress() })
      asm.mov({ r: ARG_REG_INT[2] }, { i64: BigInt(sizeOf(this.ret)) })
      asm.mov({ r: Reg64.rax }, { i64: addon.memcpyPtr.readBigInt64() })
      asm.call({ r: Reg64.rax })
    } else {
      asm.mov({ r: Reg64.r10 }, { i64: this.bufferAddress() })
      
      let ret = this.ret
      if (typeof this.ret !== 'number' && PRIMITIVE_SIZE.includes(this.ret.size)) {
        // value should deref, mapping to CType
        switch (this.ret.size) {
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
          asm.mov({ r: Reg64.rax }, { rm: Reg64.r10 }, { bit: 8 })
          break
        }
        case CType.i16:
        case CType.u16: {
          asm.mov({ r: Reg64.rax }, { rm: Reg64.r10 }, { bit: 16 })
          break
        }
        case CType.i32:
        case CType.u32: {
          asm.mov({ r: Reg64.rax }, { rm: Reg64.r10 }, { bit: 32 })
          break
        }
        case CType.ptr:
        case CType.i64:
        case CType.u64: {
          asm.mov({ r: Reg64.rax }, { rm: Reg64.r10 }, { bit: 64 })
          break
        }
        case CType.f32: {
          asm.movss({ r: Reg64.xmm0 }, { rm: Reg64.r10 })
          break
        }
        case CType.f64: {
          asm.movsd({ r: Reg64.xmm0 }, { rm: Reg64.r10 })
          break
        }
        case CType.void: {
          break
        }
        default: {
          throw 'unknown type'
        }
      }
    }

    asm.add({ r: Reg64.rsp }, { n: stackOffset })
    asm.ret()

    return asm.finish()
  }
}

// const builder = new Win64CallbackBuilder(CType.i32, [
//   CType.i8,
//   CType.i64,
//   CType.f32
// ], (d) => {
//   console.log('inner callback', d, d.a0, d.a1, d.a2)
// })
// const code = builder.build()

// // fs.writeFileSync('./a', code)
// // execSync('objdump -D --target=binary --architecture i386:x86-64:intel a', { stdio: 'inherit' })


// const ptr = addon.getExecutablePointer(code)

// addon.callPointer(ptr)