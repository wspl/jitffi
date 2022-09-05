import assert from 'assert'
import path from 'path'
import { createFunction, CType, nullptr } from '../lib'
import { struct_big_a, struct_small_a, struct_small_b, struct_small_c, struct_small_d } from './structs'

const module = path.resolve(__dirname, 'invoke_library/library')

const fn_int_arg = createFunction({
    name: 'fn_int_arg',
    arguments: [
        CType.i8,
        CType.u16,
        CType.i32,
        CType.u64,
        CType.i8,
        CType.u16,
    ],
    return: CType.void,
    module
})

const fn_int_arg_ex = createFunction({
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
    return: CType.void,
    module
})

const fn_float_arg = createFunction({
    name: 'fn_float_arg',
    arguments: [
        CType.f32,
        CType.f64,
        CType.f32,
        CType.f64,
        CType.f32,
        CType.f64,
    ],
    return: CType.void,
    module
})

const fn_float_arg_ex = createFunction({
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
    return: CType.void,
    module
})

const fn_u8_ret = createFunction({
    name: 'fn_u8_ret',
    arguments: [],
    return: CType.u8,
    module
})

const fn_i16_ret = createFunction({
    name: 'fn_i16_ret',
    arguments: [],
    return: CType.i16,
    module
})

const fn_u32_ret = createFunction({
    name: 'fn_u32_ret',
    arguments: [],
    return: CType.u32,
    module
})

const fn_i64_ret = createFunction({
    name: 'fn_i64_ret',
    arguments: [],
    return: CType.i64,
    module
})

const fn_f32_ret = createFunction({
    name: 'fn_f32_ret',
    arguments: [],
    return: CType.f32,
    module
})

const fn_f64_ret = createFunction({
    name: 'fn_f64_ret',
    arguments: [],
    return: CType.f64,
    module
})

const fn_struct_small_a_arg = createFunction({
    name: 'fn_struct_small_a_arg',
    arguments: [
        struct_small_a
    ],
    return: CType.void,
    module
})

const fn_struct_small_b_arg = createFunction({
    name: 'fn_struct_small_b_arg',
    arguments: [
        struct_small_b
    ],
    return: CType.void,
    module
})

const fn_struct_small_c_arg = createFunction({
    name: 'fn_struct_small_c_arg',
    arguments: [
        struct_small_c
    ],
    return: CType.void,
    module
})

const fn_struct_small_d_arg = createFunction({
    name: 'fn_struct_small_d_arg',
    arguments: [
        struct_small_d
    ],
    return: CType.void,
    module
})

const fn_struct_big_a_arg = createFunction({
    name: 'fn_struct_big_a_arg',
    arguments: [
        struct_big_a
    ],
    return: CType.void,
    module
})

const fn_struct_small_a_ret = createFunction({
    name: 'fn_struct_small_a_ret',
    arguments: [],
    return: struct_small_a,
    module
})

const fn_struct_small_b_ret = createFunction({
    name: 'fn_struct_small_b_ret',
    arguments: [],
    return: struct_small_b,
    module
})

const fn_struct_small_c_ret = createFunction({
    name: 'fn_struct_small_c_ret',
    arguments: [],
    return: struct_small_c,
    module
})

const fn_struct_small_d_ret = createFunction({
    name: 'fn_struct_small_d_ret',
    arguments: [],
    return: struct_small_d,
    module
})

const fn_struct_big_a_ret = createFunction({
    name: 'fn_struct_big_a_ret',
    arguments: [],
    return: struct_big_a,
    module
})

fn_int_arg(-128, 65535, -2147483648, 18446744073709551615n, -128, 65535);
console.log('passed: fn_int_arg')
fn_int_arg_ex(nullptr, nullptr, nullptr, nullptr, nullptr, nullptr, -128, 65535, -2147483648, 18446744073709551615n, -128, 65535);
console.log('passed: fn_int_arg_ex')
fn_float_arg(3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359);
console.log('passed: fn_float_arg')
fn_float_arg_ex(nullptr, nullptr, nullptr, nullptr, nullptr, nullptr, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359);
console.log('passed: fn_float_arg_ex')

assert(fn_u8_ret() === 255)
console.log('passed: fn_u8_ret')
assert(fn_i16_ret() === -32768)
console.log('passed: fn_i16_ret')
assert(fn_u32_ret() === 4294967295)
console.log('passed: fn_u32_ret')
assert(fn_i64_ret() === 9223372036854775807n)
console.log('passed: fn_i64_ret')
assert(Math.abs(fn_f32_ret() - 3.14159265359) < 0.0001)
console.log('passed: fn_f32_ret')
assert(Math.abs(fn_f64_ret() - 3.14159265359) < 0.0001)
console.log('passed: fn_f64_ret')

fn_struct_small_a_arg(new struct_small_a({
    a: -2147483648
}))
console.log('passed: fn_struct_small_a_arg')
fn_struct_small_b_arg(new struct_small_b({
    a: 3.14159265359
}))
console.log('passed: fn_struct_small_b_arg')
fn_struct_small_c_arg(new struct_small_c({
    a: -128,
    b: 65535
}))
console.log('passed: fn_struct_small_c_arg')
fn_struct_small_d_arg(new struct_small_d({
    a: 9223372036854775807n,
    b: 3.14159265359
}))
console.log('passed: fn_struct_small_d_arg')
fn_struct_big_a_arg(new struct_big_a({
    a: 255,
    b: 18446744073709551615n,
    c: 9223372036854775807n,
}))
console.log('passed: fn_struct_big_a_arg')

const struct_small_a_val = fn_struct_small_a_ret()
assert(struct_small_a_val.a === -2147483648)
console.log('passed: fn_struct_small_a_ret')

const struct_small_b_val = fn_struct_small_b_ret()
assert(Math.abs(struct_small_b_val.a - 3.14159265359) < 0.0001)
console.log('passed: fn_struct_small_b_ret')

const struct_small_c_val = fn_struct_small_c_ret()
assert(struct_small_c_val.a === -128)
assert(struct_small_c_val.b === 65535)
console.log('passed: fn_struct_small_c_ret')

const struct_small_d_val = fn_struct_small_d_ret()
assert(struct_small_d_val.a === 9223372036854775807n)
assert(Math.abs(struct_small_d_val.b - 3.14159265359) < 0.0001)
console.log('passed: fn_struct_small_d_ret')

const struct_big_a_val = fn_struct_big_a_ret()
assert(struct_big_a_val.a === 255)
assert(struct_big_a_val.b === 18446744073709551615n)
assert(struct_big_a_val.c === 9223372036854775807n)
console.log('passed: fn_struct_big_a_ret')

console.log('all passed')