import assert from 'assert'
import path from 'path'
import { createCallbackCreator, createFunction, CType, nullptr } from '../lib'
import { struct_big_a, struct_small_a, struct_small_b, struct_small_c, struct_small_d } from './structs'

const module = path.resolve(__dirname, 'callback_library/library')

const fn_int_arg = createCallbackCreator({
    name: 'fn_int_arg',
    arguments: [
        CType.i8,
        CType.u16,
        CType.i32,
        CType.u64,
        CType.i8,
        CType.u16,
    ],
    return: CType.void
})

const fn_int_arg_ex = createCallbackCreator({
    name: 'fn_int_arg_ex',
    arguments: [
        CType.ptr,
        CType.ptr,
        CType.ptr,
        CType.ptr,
        CType.ptr,
        CType.ptr,
        CType.i8,
        CType.u16,
        CType.i32,
        CType.u64,
        CType.i8,
        CType.u16,
    ],
    return: CType.void
})

const fn_float_arg = createCallbackCreator({
    name: 'fn_float_arg',
    arguments: [
        CType.f32,
        CType.f64,
        CType.f32,
        CType.f64,
        CType.f32,
        CType.f64,
    ],
    return: CType.void
})

const fn_float_arg_ex = createCallbackCreator({
    name: 'fn_float_arg_ex',
    arguments: [
        CType.ptr,
        CType.ptr,
        CType.ptr,
        CType.ptr,
        CType.ptr,
        CType.ptr,
        CType.f32,
        CType.f64,
        CType.f32,
        CType.f64,
        CType.f32,
        CType.f64,
    ],
    return: CType.void
})

const fn_u8_ret = createCallbackCreator({
    name: 'fn_u8_ret',
    arguments: [],
    return: CType.u8
})

const fn_i16_ret = createCallbackCreator({
    name: 'fn_i16_ret',
    arguments: [],
    return: CType.i16
})

const fn_u32_ret = createCallbackCreator({
    name: 'fn_u32_ret',
    arguments: [],
    return: CType.u32
})

const fn_i64_ret = createCallbackCreator({
    name: 'fn_i64_ret',
    arguments: [],
    return: CType.i64
})

const fn_f32_ret = createCallbackCreator({
    name: 'fn_f32_ret',
    arguments: [],
    return: CType.f32
})

const fn_f64_ret = createCallbackCreator({
    name: 'fn_f64_ret',
    arguments: [],
    return: CType.f64
})

const fn_struct_small_a_arg = createCallbackCreator({
    name: 'fn_struct_small_a_arg',
    arguments: [
        struct_small_a
    ],
    return: CType.void
})

const fn_struct_small_b_arg = createCallbackCreator({
    name: 'fn_struct_small_b_arg',
    arguments: [
        struct_small_b
    ],
    return: CType.void
})

const fn_struct_small_c_arg = createCallbackCreator({
    name: 'fn_struct_small_c_arg',
    arguments: [
        struct_small_c
    ],
    return: CType.void
})

const fn_struct_small_d_arg = createCallbackCreator({
    name: 'fn_struct_small_d_arg',
    arguments: [
        struct_small_d
    ],
    return: CType.void
})

const fn_struct_big_a_arg = createCallbackCreator({
    name: 'fn_struct_big_a_arg',
    arguments: [
        struct_big_a
    ],
    return: CType.void
})

const fn_struct_small_a_ret = createCallbackCreator({
    name: 'fn_struct_small_a_ret',
    arguments: [],
    return: struct_small_a
})

const fn_struct_small_b_ret = createCallbackCreator({
    name: 'fn_struct_small_b_ret',
    arguments: [],
    return: struct_small_b
})

const fn_struct_small_c_ret = createCallbackCreator({
    name: 'fn_struct_small_c_ret',
    arguments: [],
    return: struct_small_c
})

const fn_struct_small_d_ret = createCallbackCreator({
    name: 'fn_struct_small_d_ret',
    arguments: [],
    return: struct_small_d
})

const fn_struct_big_a_ret = createCallbackCreator({
    name: 'fn_struct_big_a_ret',
    arguments: [],
    return: struct_big_a
})

const call = (fn: string) => createFunction({
    name: `call_${fn}`,
    arguments: [CType.ptr],
    return: CType.void,
    module
})

call('fn_int_arg')(fn_int_arg.create((a0: any, a1: any, a2: any, a3: any, a4: any, a5: any) => {
    console.log(a0, a1, a2, a3, a4, a5)
    assert(a0 === -128)
    assert(a1 === 65535)
    assert(a2 === -2147483648)
    assert(a3 === 18446744073709551615n)
    assert(a4 === -128)
    assert(a5 === 65535)
}))
console.log('passed: fn_int_arg')

call('fn_int_arg_ex')(fn_int_arg_ex.create((_0: any, _1: any, _2: any, _3: any, _4: any, _5: any,
                                            a0: any, a1: any, a2: any, a3: any, a4: any, a5: any) => {
    console.log(a0, a1, a2, a3, a4, a5)
    assert(a0 === -128)
    assert(a1 === 65535)
    assert(a2 === -2147483648)
    assert(a3 === 18446744073709551615n)
    assert(a4 === -128)
    assert(a5 === 65535)
}))
console.log('passed: fn_int_arg_ex')

call('fn_float_arg')(fn_float_arg.create((a0: any, a1: any, a2: any, a3: any, a4: any, a5: any) => {
    console.log(a0, a1, a2, a3, a4, a5)
    assert(Math.abs(a0 - 3.14159265359) < 0.0001)
    assert(Math.abs(a1 - 3.14159265359) < 0.0001)
    assert(Math.abs(a2 - 3.14159265359) < 0.0001)
    assert(Math.abs(a3 - 3.14159265359) < 0.0001)
    assert(Math.abs(a4 - 3.14159265359) < 0.0001)
    assert(Math.abs(a5 - 3.14159265359) < 0.0001)
}))
console.log('passed: fn_float_arg')

call('fn_float_arg_ex')(fn_float_arg_ex.create((_0: any, _1: any, _2: any, _3: any, _4: any, _5: any,
                                             a0: any, a1: any, a2: any, a3: any, a4: any, a5: any) => {
    assert(Math.abs(a0 - 3.14159265359) < 0.0001)
    assert(Math.abs(a1 - 3.14159265359) < 0.0001)
    assert(Math.abs(a2 - 3.14159265359) < 0.0001)
    assert(Math.abs(a3 - 3.14159265359) < 0.0001)
    assert(Math.abs(a4 - 3.14159265359) < 0.0001)
    assert(Math.abs(a5 - 3.14159265359) < 0.0001)
}))
console.log('passed: fn_float_arg_ex')

call('fn_u8_ret')(fn_u8_ret.create(() => 255))
console.log('passed: fn_u8_ret')

call('fn_i16_ret')(fn_i16_ret.create(() => -32768))
console.log('passed: fn_i16_ret')

call('fn_u32_ret')(fn_u32_ret.create(() => 4294967295))
console.log('passed: fn_u32_ret')

call('fn_i64_ret')(fn_i64_ret.create(() => 9223372036854775807n))
console.log('passed: fn_i64_ret')

call('fn_f32_ret')(fn_f32_ret.create(() => 3.14159265359))
console.log('passed: fn_f32_ret')

call('fn_f64_ret')(fn_f64_ret.create(() => 3.14159265359))
console.log('passed: fn_f64_ret')

call('fn_struct_small_a_arg')(fn_struct_small_a_arg.create((st: any) => {
    assert(st.a === -2147483648)
}))
console.log('passed: fn_struct_small_a_arg')

call('fn_struct_small_b_arg')(fn_struct_small_b_arg.create((st: any) => {
    assert(Math.abs(st.a - 3.14159265359) < 0.0001)
}))
console.log('passed: fn_struct_small_b_arg')

call('fn_struct_small_c_arg')(fn_struct_small_c_arg.create((st: any) => {
    assert(st.a === -128)
    assert(st.b === 65535)
}))
console.log('passed: fn_struct_small_c_arg')

call('fn_struct_small_d_arg')(fn_struct_small_d_arg.create((st: any) => {
    assert(st.a === 9223372036854775807n)
    assert(Math.abs(st.b - 3.14159265359) < 0.0001)
}))
console.log('passed: fn_struct_small_d_arg')

call('fn_struct_big_a_arg')(fn_struct_big_a_arg.create((st: any) => {
    assert(st.a === 255)
    assert(st.b === 18446744073709551615n)
    assert(st.c === 9223372036854775807n)
}))
console.log('passed: fn_struct_big_a_arg')

call('fn_struct_small_a_ret')(fn_struct_small_a_ret.create(() => new struct_small_a({
    a: -2147483648
})))
console.log('passed: fn_struct_small_a_ret')

call('fn_struct_small_b_ret')(fn_struct_small_b_ret.create(() => new struct_small_b({
    a: 3.14159265359
})))
console.log('passed: fn_struct_small_b_ret')

call('fn_struct_small_c_ret')(fn_struct_small_c_ret.create(() => new struct_small_c({
    a: -128,
    b: 65535
})))
console.log('passed: fn_struct_small_c_ret')

call('fn_struct_small_d_ret')(fn_struct_small_d_ret.create(() => new struct_small_d({
    a: 9223372036854775807n,
    b: 3.14159265359
})))
console.log('passed: fn_struct_small_d_ret')

call('fn_struct_big_a_ret')(fn_struct_big_a_ret.create(() => new struct_big_a({
    a: 255,
    b: 18446744073709551615n,
    c: 9223372036854775807n
})))
console.log('passed: fn_struct_big_a_ret')

console.log('all passed')