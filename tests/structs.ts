import { CType, defineStruct } from "../lib"

export const struct_small_a = defineStruct({
    a: CType.i32
})

export const struct_small_b = defineStruct({
    a: CType.f64
})

export const struct_small_c = defineStruct({
    a: CType.i8,
    b: CType.u16
})

export const struct_small_d = defineStruct({
    a: CType.i64,
    b: CType.f32
})

export const struct_big_a = defineStruct({
    a: CType.u8,
    b: CType.u64,
    c: CType.i64
})