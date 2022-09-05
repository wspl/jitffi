#include <stdint.h>
#include <assert.h>
#include <math.h>
#include "../structs.h"

#ifdef _WIN32
#   define EXPORTED  __declspec( dllexport )
#else
#   define EXPORTED
#endif

EXPORTED void fn_int_arg(int8_t a0, uint16_t a1, int32_t a2, uint64_t a3, int8_t a4, uint16_t a5) {
    assert(a0 == -128);
    assert(a1 == 65535);
    assert(a2 == -2147483648);
    assert(a3 == 18446744073709551615U);
    assert(a4 == -128);
    assert(a5 == 65535);
}

EXPORTED void fn_int_arg_ex(void* _0, void* _1, void* _2, void* _3, void* _4, void* _5,
                            int8_t a0, uint16_t a1, int32_t a2, int64_t a3, int8_t a4, uint16_t a5) {
    assert(a0 == -128);
    assert(a1 == 65535);
    assert(a2 == -2147483648);
    assert(a3 == 18446744073709551615U);
    assert(a4 == -128);
    assert(a5 == 65535);
}

EXPORTED void fn_float_arg(float a0, double a1, float a2, double a3, float a4, double a5) {
    assert(fabs(a0 - 3.14159265359) < 0.0001);
    assert(fabs(a1 - 3.14159265359) < 0.0001);
    assert(fabs(a2 - 3.14159265359) < 0.0001);
    assert(fabs(a3 - 3.14159265359) < 0.0001);
    assert(fabs(a4 - 3.14159265359) < 0.0001);
    assert(fabs(a5 - 3.14159265359) < 0.0001);
}

EXPORTED void fn_float_arg_ex(void* _0, void* _1, void* _2, void* _3, void* _4, void* _5,
                              float a0, double a1, float a2, double a3, float a4, double a5) {
    assert(fabs(a0 - 3.14159265359) < 0.0001);
    assert(fabs(a1 - 3.14159265359) < 0.0001);
    assert(fabs(a2 - 3.14159265359) < 0.0001);
    assert(fabs(a3 - 3.14159265359) < 0.0001);
    assert(fabs(a4 - 3.14159265359) < 0.0001);
    assert(fabs(a5 - 3.14159265359) < 0.0001);
}

EXPORTED uint8_t fn_u8_ret() {
    return 255;
}

EXPORTED int16_t fn_i16_ret() {
    return -32768;
}

EXPORTED uint32_t fn_u32_ret() {
    return 4294967295;
}

EXPORTED int64_t fn_i64_ret() {
    return 9223372036854775807U;
}

EXPORTED float fn_f32_ret() {
    return 3.14159265359;
}

EXPORTED double fn_f64_ret() {
    return 3.14159265359;
}

EXPORTED void fn_struct_small_a_arg(struct struct_small_a a0) {
    assert(a0.a == -2147483648);
}

EXPORTED void fn_struct_small_b_arg(struct struct_small_b a0) {
    assert(fabs(a0.a - 3.14159265359) < 0.0001);
}

EXPORTED void fn_struct_small_c_arg(struct struct_small_c a0) {
    assert(a0.a == -128);
    assert(a0.b == 65535);
}

EXPORTED void fn_struct_small_d_arg(struct struct_small_d a0) {
    assert(a0.a == 9223372036854775807U);
    assert(fabs(a0.b - 3.14159265359) < 0.0001);
}

EXPORTED void fn_struct_big_a_arg(struct struct_big_a a0) {
    assert(a0.a == 255);
    assert(a0.b == 18446744073709551615U);
    assert(a0.c == 9223372036854775807U);
}

EXPORTED struct struct_small_a fn_struct_small_a_ret() {
    struct struct_small_a ret;
    ret.a = -2147483648;
    return ret;
}

EXPORTED struct struct_small_b fn_struct_small_b_ret() {
    struct struct_small_b ret;
    ret.a = 3.14159265359;
    return ret;
}

EXPORTED struct struct_small_c fn_struct_small_c_ret() {
    struct struct_small_c ret;
    ret.a = -128;
    ret.b = 65535;
    return ret;
}

EXPORTED struct struct_small_d fn_struct_small_d_ret() {
    struct struct_small_d ret;
    ret.a = 9223372036854775807U;
    ret.b = 3.14159265359;
    return ret;
}

EXPORTED struct struct_big_a fn_struct_big_a_ret() {
    struct struct_big_a ret;
    ret.a = 255;
    ret.b = 18446744073709551615U;
    ret.c = 9223372036854775807U;
    return ret;
}