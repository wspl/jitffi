import assert from 'assert'
import path from 'path'
import { createFunction, CType, nullptr } from '../lib'
import { Reg64, X64Assembler } from '../lib/assembler/x64'
import { struct_big_a, struct_small_a, struct_small_b, struct_small_c } from './structs'

const module = path.resolve(__dirname, 'invoke_library/library')

// const asm = new X64Assembler()
// asm.movss({ r: Reg64.xmm4 }, { rm: Reg64.rax })
// console.log(asm.finish())

const fn_struct_big_a_arg = createFunction({
    name: 'fn_struct_big_a_arg',
    arguments: [
        struct_big_a
    ],
    return: CType.void,
    module
})


fn_struct_big_a_arg(new struct_big_a({
    a: 255,
    b: 18446744073709551615n,
    c: 9223372036854775807n,
}))
console.log('passed: fn_struct_big_a_arg')