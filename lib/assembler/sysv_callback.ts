import { CallbackBuilder } from "./callback";
import { ArgTarget, ARG_REG_INT_GENERAL, ARG_REG_INT_RETURN_AS_ARG, ARG_REG_FLOAT, groupArgs, isFloatStruct, isPrimitiveStruct, primitiveStructToCFloatType, primitiveStructToCIntType, tryStructDivide } from "./sysv";
import { align8, Reg64, X64Assembler } from "./x64";
import bindings from 'bindings'
import { CType, sizeOf } from "../c_types";
const addon = bindings('jitffi')


export class SystemVCallbackBuilder extends CallbackBuilder {
  build(): Buffer {
    const retDivide = typeof this.ret !== 'number' ? tryStructDivide(this.ret) : null
    const retAsArg = typeof this.ret !== 'number' && !isPrimitiveStruct(this.ret) && !retDivide
    
    const ARG_REG_INT = retAsArg ? ARG_REG_INT_RETURN_AS_ARG : ARG_REG_INT_GENERAL
    
    // stack structure:
    // |                     |  call_callback addr |
    //                      or
    // |                     |      memcpy addr    |
    //                      and
    // | padding / rdi cache |    callback addr    |
    // |     extra arg 0     |     extra arg 1     |
    // |           extra arg 2 (big struct)        |
    // |     extra arg 3     |                     |

    // group args by target reg or stack
    const {
      intRegArgs,
      floatRegArgs,
      stackArgs
    } = groupArgs(
      ARG_REG_INT,
      this.args,
      (i) => this.addressOfArg(i)
    )

    const stackPadding = 8

    const asm = new X64Assembler()
    
    // System V enter
    asm.push({ r: Reg64.rbp })
    asm.mov({ r: Reg64.rbp }, { r: Reg64.rsp })

    asm.sub({ r: Reg64.rsp }, { n: stackPadding })

    // asm.brk()

    if (retAsArg) {
      // cache rdi to stack
      asm.mov({ rm: Reg64.rsp }, { r: Reg64.rdi })
    }

    // asm.brk()

    // mov args from reg or stack to buffer
    // int reg args
    for (let i = 0; i < intRegArgs.length; i++) {
      const argInfo = intRegArgs[i]
      const argReg = ARG_REG_INT[i]

      // target: address of buffer with offset
      asm.mov({ r: Reg64.rax }, { i64: argInfo.bufferAddress })

      switch(argInfo.type) {
        case CType.i8:
        case CType.u8: {
          asm.mov({ rm: Reg64.rax }, { r: argReg }, { bit: 8 })
          break
        }
        case CType.i16:
        case CType.u16: {
          asm.mov({ rm: Reg64.rax }, { r: argReg }, { bit: 16 })
          break
        }
        case CType.i32:
        case CType.u32: {
          asm.mov({ rm: Reg64.rax }, { r: argReg }, { bit: 32 })
          break
        }
        case CType.ptr:
        case CType.i64:
        case CType.u64: {
          asm.mov({ rm: Reg64.rax }, { r: argReg }, { bit: 64 })
          break
        }
        default: {
          throw 'unknown type'
        }
      }
    }
    // float reg args
    for (let i = 0; i < floatRegArgs.length; i++) {
      const argInfo = floatRegArgs[i]
      const argReg = ARG_REG_FLOAT[i]

      // target: address of buffer with offset
      asm.mov({ r: Reg64.rax }, { i64: argInfo.bufferAddress })

      switch(argInfo.type) {
        case CType.f32: {
          asm.movss({ rm: Reg64.rax }, { r: argReg })
          break
        }
        case CType.f64: {
          asm.movsd({ rm: Reg64.rax }, { r: argReg })
          break
        }
        default: {
          throw 'unknown type'
        }
      }
    }
    // stack args
    const stackArgStart = stackPadding + 16 // TODO: when 8 and when 16
    let stackOffset = 0
    for (let i = 0; i < stackArgs.length; i++) {
      const argInfo = stackArgs[i]
      
      if (argInfo.size) {
        // non-primitive size struct
        asm.mov({ r: ARG_REG_INT_GENERAL[0] }, { i64: argInfo.bufferAddress })
        asm.mov({ r: ARG_REG_INT_GENERAL[1] }, { r: Reg64.rsp })
        asm.add({ r: ARG_REG_INT_GENERAL[1] }, { n: stackArgStart + stackOffset })
        asm.mov({ r: ARG_REG_INT_GENERAL[2] }, { i64: BigInt(argInfo.size) })
        asm.mov({ r: Reg64.rax }, { i64: addon.memcpyPtr.readBigInt64() })
        asm.call({ r: Reg64.rax })
        stackOffset += align8(argInfo.size)
        continue
      }

      // target: address of buffer with offset
      asm.mov({ r: Reg64.rax }, { i64: argInfo.bufferAddress })
      // source: address of stack
      asm.mov({ r: Reg64.r10 }, { rm: Reg64.rsp, disp: stackArgStart + stackOffset })
      // do mov
      switch(argInfo.type) {
        case CType.i8:
        case CType.u8: {
          // asm.brk()
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
      stackOffset += 8
    }

    // invoke callback
    asm.mov({ r: ARG_REG_INT_GENERAL[0] }, { i64: addon.envPtr.readBigInt64() })
    asm.mov({ r: ARG_REG_INT_GENERAL[1] }, { i64: this.callbackReference.readBigInt64() })
    asm.mov({ r: Reg64.rax }, { i64: addon.callCallbackPtr.readBigInt64() })
    asm.call({ r: Reg64.rax })

    // process return value
    if (retAsArg) {
      // copy return value to rdi
      asm.mov({ r: ARG_REG_INT_GENERAL[0] }, { rm: Reg64.rsp }) // get rdi from stack cache
      asm.mov({ r: ARG_REG_INT_GENERAL[1] }, { i64: this.bufferAddress() })
      asm.mov({ r: ARG_REG_INT_GENERAL[2] }, { i64: BigInt(sizeOf(this.ret)) })
      asm.mov({ r: Reg64.rax }, { i64: addon.memcpyPtr.readBigInt64() })
      asm.call({ r: Reg64.rax })
    } else {
      asm.mov({ r: Reg64.r10 }, { i64: this.bufferAddress() })
      let ret = this.ret

      if (typeof ret !== 'number' && isPrimitiveStruct(ret)) {
        if (isFloatStruct(ret)) {
          ret = primitiveStructToCFloatType(ret)
        } else {
          ret = primitiveStructToCIntType(ret)
        }
      }

      if (retDivide) {
        if (retDivide[0] === ArgTarget.int && retDivide[1] === ArgTarget.int) {
          asm.mov({ r: Reg64.rax }, { rm: Reg64.r10 })
          asm.mov({ r: Reg64.rdx }, { rm: Reg64.r10, disp: 8 })
        } else if (retDivide[0] === ArgTarget.sse && retDivide[1] === ArgTarget.sse) {
          asm.movsd({ r: Reg64.xmm0 }, { rm: Reg64.r10 })
          asm.movsd({ r: Reg64.xmm1 }, { rm: Reg64.r10, disp: 8 })
        } else if (retDivide[0] === ArgTarget.int && retDivide[1] === ArgTarget.sse) {
          asm.mov({ r: Reg64.rax }, { rm: Reg64.r10 })
          asm.movsd({ r: Reg64.xmm0 }, { rm: Reg64.r10, disp: 8 })
        } else if (retDivide[0] === ArgTarget.sse && retDivide[1] === ArgTarget.int) {
          asm.movsd({ r: Reg64.xmm0 }, { rm: Reg64.r10 })
          asm.mov({ r: Reg64.rax }, { rm: Reg64.r10, disp: 8 })
        }
      } else {
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
    }

    // leave
    asm.add({ r: Reg64.rsp }, { n: stackPadding })
    asm.pop({ r: Reg64.rbp })

    asm.ret()

    return asm.finish()
  }
}