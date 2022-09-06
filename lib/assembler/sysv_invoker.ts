import { CType, NativeType } from "../c_types";
import { InvokerBuilder } from "./invoker";
import { ArgInfo, ArgTarget, ARG_REG_FLOAT, ARG_REG_INT_GENERAL, ARG_REG_INT_RETURN_AS_ARG, groupArgs, isFloatStruct, isPrimitiveStruct, primitiveStructToCFloatType, primitiveStructToCIntType, tryStructDivide } from "./sysv";
import { align16, align8, Reg64, X64Assembler } from "./x64";
import bindings from 'bindings'
const addon = bindings('jitffi')

export class SystemVInvokerBuilder extends InvokerBuilder {
  build(): Buffer {
    const retDivide = typeof this.ret !== 'number' ? tryStructDivide(this.ret) : null
    const retAsArg = typeof this.ret !== 'number' && !isPrimitiveStruct(this.ret) && !retDivide

    const ARG_REG_INT = retAsArg ? ARG_REG_INT_RETURN_AS_ARG : ARG_REG_INT_GENERAL

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

    const stackForArguments = align16(
      stackArgs.reduce((s, t) => s + (t.size ? align8(t.size) : 8), 0)
    )

    const asm = new X64Assembler()

    // System V enter
    asm.push({ r: Reg64.rbp })
    asm.mov({ r: Reg64.rbp }, { r: Reg64.rsp })

    const stackStart = stackForArguments
    asm.sub({ r: Reg64.rsp }, { n: stackStart })

    // mov args from buffer to reg or stack
    // stack args
    let stackOffset = 0
    for (let i = 0; i < stackArgs.length; i++) {
      const argInfo = stackArgs[i]

      if (argInfo.size) {
        // non-primitive size struct
        asm.mov({ r: ARG_REG_INT_GENERAL[0] }, { r: Reg64.rsp })
        if (stackOffset > 0) {
          asm.add({ r: ARG_REG_INT_GENERAL[0] }, { n: stackOffset })
        }
        asm.mov({ r: ARG_REG_INT_GENERAL[1] }, { i64: argInfo.bufferAddress })
        asm.mov({ r: ARG_REG_INT_GENERAL[2] }, { i64: BigInt(argInfo.size) })
        asm.mov({ r: Reg64.rax }, { i64: addon.memcpyPtr.readBigInt64() })
        asm.call({ r: Reg64.rax })
        stackOffset += align8(argInfo.size)
        continue
      }

      asm.mov({ r: Reg64.rax }, { i64: argInfo.bufferAddress });
      switch(argInfo.type) {
        case CType.i8:
        case CType.u8: {
          asm.movzx({ r: Reg64.r10 }, { rm: Reg64.rax }, { bit: 8 })
          asm.mov({ rm: Reg64.rsp, disp: stackOffset }, { r: Reg64.r10 })
          break
        }
        case CType.i16:
        case CType.u16: {
          asm.movzx({ r: Reg64.r10 }, { rm: Reg64.rax }, { bit: 16 })
          asm.mov({ rm: Reg64.rsp, disp: stackOffset }, { r: Reg64.r10 })
          break
        }
        case CType.i32:
        case CType.u32:
        case CType.f32: {
          asm.mov({ r: Reg64.r10 }, { rm: Reg64.rax }, { bit: 32 })
          asm.mov({ rm: Reg64.rsp, disp: stackOffset }, { r: Reg64.r10 }, { bit: 32 })
          break
        }
        case CType.ptr:
        case CType.i64:
        case CType.u64:
        case CType.f64: {
          asm.mov({ r: Reg64.r10 }, { rm: Reg64.rax }, { bit: 64 })
          asm.mov({ rm: Reg64.rsp, disp: stackOffset }, { r: Reg64.r10 }, { bit: 64 })
          break
        }
        default: {
          throw 'unknown type'
        }
      }
      stackOffset += 8
    }

    // int reg args
    for (let i = 0; i < intRegArgs.length; i++) {
      const argInfo = intRegArgs[i]
      const argReg = ARG_REG_INT[i]
      
      // if (argInfo.pointer) {
      //   asm.mov({ r: argReg }, { i64: argInfo.fromAddress })
      //   continue
      // }

      asm.mov({ r: Reg64.rax }, { i64: argInfo.bufferAddress });
      switch (argInfo.type) {
        case CType.i8:
        case CType.u8: {
          asm.movzx({ r: argReg }, { rm: Reg64.rax }, { bit: 8 })
          break
        }
        case CType.i16:
        case CType.u16: {
          asm.movzx({ r: argReg }, { rm: Reg64.rax }, { bit: 16 })
          break
        }
        case CType.i32:
        case CType.u32: {
          asm.mov({ r: argReg }, { rm: Reg64.rax }, { bit: 32 })
          break
        }
        case CType.i64:
        case CType.u64:
        case CType.ptr: {
          asm.mov({ r: argReg }, { rm: Reg64.rax }, { bit: 64 })
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

      asm.mov({ r: Reg64.rax }, { i64: argInfo.bufferAddress });
      switch (argInfo.type) {
        case CType.f32: {
          asm.movss({ r: argReg }, { rm: Reg64.rax })
          break
        }
        case CType.f64: {
          asm.movsd({ r: argReg }, { rm: Reg64.rax })
          break
        }
        default: {
          throw 'unknown type'
        }
      }
    }

    // ret as reg: pass pre-allocated stack address as rdi
    if (retAsArg) {
      asm.mov({ r: Reg64.rdi }, { i64: this.bufferAddress() })
    }

    // call
    asm.mov({ r: Reg64.rax }, { i64: this.calleePtr })
    asm.call({ r: Reg64.rax })

    // write ret to buffer
    if (!retAsArg) {
      asm.mov({ r: Reg64.r10 }, { i64: this.bufferAddress() });
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
          asm.mov({ rm: Reg64.r10 }, { r: Reg64.rax })
          asm.mov({ rm: Reg64.r10, disp: 8 }, { r: Reg64.rdx })
        } else if (retDivide[0] === ArgTarget.sse && retDivide[1] === ArgTarget.sse) {
          asm.movsd({ rm: Reg64.r10 }, { r: Reg64.xmm0 })
          asm.movsd({ rm: Reg64.r10, disp: 8 }, { r: Reg64.xmm1 })
        } else if (retDivide[0] === ArgTarget.int && retDivide[1] === ArgTarget.sse) {
          asm.mov({ rm: Reg64.r10 }, { r: Reg64.rax })
          asm.movsd({ rm: Reg64.r10, disp: 8 }, { r: Reg64.xmm0 })
        } else if (retDivide[0] === ArgTarget.sse && retDivide[1] === ArgTarget.int) {
          asm.movsd({ rm: Reg64.r10 }, { r: Reg64.xmm0 })
          asm.mov({ rm: Reg64.r10, disp: 8 }, { r: Reg64.rax })
        }
      } else {
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
    }

    // ret zero
    asm.xor({ r: Reg64.rax }, { r: Reg64.rax })

    // leave
    asm.add({ r: Reg64.rsp }, { n: stackStart })
    asm.pop({ r: Reg64.rbp })

    asm.ret()

    return asm.finish()
  }
}
