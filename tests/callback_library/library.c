#include <stdio.h>
#include <stdint.h>
#include <assert.h>
#include <math.h>
#include "../structs.h"

#ifdef _WIN32
#   define EXPORTED  __declspec( dllexport )
#else
#   define EXPORTED
#endif

typedef void (*fn_int_arg_t)(int8_t a0, uint16_t a1, int32_t a2, uint64_t a3, int8_t a4, uint16_t a5);
EXPORTED void call_fn_int_arg(char* ptr) {
    ((fn_int_arg_t)ptr)(-128, 65535, -2147483648, 18446744073709551615U, -128, 65535);
}

typedef void (*fn_int_arg_ex_t)(void* _0, void* _1, void* _2, void* _3, void* _4, void* _5,
                                int8_t a0, uint16_t a1, int32_t a2, int64_t a3, int8_t a4, uint16_t a5);
EXPORTED void call_fn_int_arg_ex(char* ptr) {
    ((fn_int_arg_ex_t)ptr)(0, 0, 0, 0, 0, 0, -128, 65535, -2147483648, 18446744073709551615U, -128, 65535);
}

typedef void (*fn_float_arg_t)(float a0, double a1, float a2, double a3, float a4, double a5);
EXPORTED void call_fn_float_arg(char* ptr) {
    ((fn_float_arg_t)ptr)(3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359);
}

typedef void (*fn_float_arg_ex_t)(void* _0, void* _1, void* _2, void* _3, void* _4, void* _5,
                                  float a0, double a1, float a2, double a3, float a4, double a5);
EXPORTED void call_fn_float_arg_ex(char* ptr) {
    ((fn_float_arg_ex_t)ptr)(0, 0, 0, 0, 0, 0, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359, 3.14159265359);
}

typedef uint8_t (*fn_u8_ret_t)();
EXPORTED void call_fn_u8_ret(char* ptr) {
    uint8_t ret = ((fn_u8_ret_t)(ptr))();
    assert(ret == 255);
}

typedef int16_t (*fn_i16_ret_t)();
EXPORTED void call_fn_i16_ret(char* ptr) {
    int16_t ret = ((fn_i16_ret_t)(ptr))();
    assert(ret == -32768);
}

typedef uint32_t (*fn_u32_ret_t)();
EXPORTED void call_fn_u32_ret(char* ptr) {
    uint32_t ret = ((fn_u32_ret_t)(ptr))();
    assert(ret == 4294967295);
}

typedef int64_t (*fn_i64_ret_t)();
EXPORTED void call_fn_i64_ret(char* ptr) {
    int64_t ret = ((fn_i64_ret_t)(ptr))();
    assert(ret == 9223372036854775807U);
}

typedef float (*fn_f32_ret_t)();
EXPORTED void call_fn_f32_ret(char* ptr) {
    float ret = ((fn_f32_ret_t)(ptr))();
    assert(fabs(ret - 3.14159265359) < 0.0001);
}

typedef double (*fn_f64_ret_t)();
EXPORTED void call_fn_f64_ret(char* ptr) {
    double ret = ((fn_f64_ret_t)(ptr))();
    assert(fabs(ret - 3.14159265359) < 0.0001);
}

typedef void (*fn_struct_small_a_arg_t)(struct struct_small_a a0);
EXPORTED void call_fn_struct_small_a_arg(char* ptr) {
    struct struct_small_a st;
    st.a = -2147483648;
    ((fn_struct_small_a_arg_t)ptr)(st);
}

typedef void (*fn_struct_small_b_arg_t)(struct struct_small_b a0);
EXPORTED void call_fn_struct_small_b_arg(char* ptr) {
    struct struct_small_b st;
    st.a = 3.14159265359;
    ((fn_struct_small_b_arg_t)ptr)(st);
}

typedef void (*fn_struct_small_c_arg_t)(struct struct_small_c a0);
EXPORTED void call_fn_struct_small_c_arg(char* ptr) {
    struct struct_small_c st;
    st.a = -128;
    st.b = 65535;
    ((fn_struct_small_c_arg_t)ptr)(st);
}

typedef void (*fn_struct_small_d_arg_t)(struct struct_small_d a0);
EXPORTED void call_fn_struct_small_d_arg(char* ptr) {
    struct struct_small_d st;
    st.a = 9223372036854775807U;
    st.b = 3.14159265359;
    ((fn_struct_small_d_arg_t)ptr)(st);
}

typedef void (*fn_struct_big_a_arg_t)(struct struct_big_a a0);
EXPORTED void call_fn_struct_big_a_arg(char* ptr) {
    struct struct_big_a st;
    st.a = 255;
    st.b = 18446744073709551615U;
    st.c = 9223372036854775807U;
    ((fn_struct_big_a_arg_t)ptr)(st);
}

typedef struct struct_small_a (*fn_struct_small_a_ret)();
EXPORTED void call_fn_struct_small_a_ret(char* ptr) {
    struct struct_small_a ret = ((fn_struct_small_a_ret)ptr)();
    assert(ret.a == -2147483648);
}

typedef struct struct_small_b (*fn_struct_small_b_ret)();
EXPORTED void call_fn_struct_small_b_ret(char* ptr) {
    struct struct_small_b ret = ((fn_struct_small_b_ret)ptr)();
    assert(fabs(ret.a - 3.14159265359) < 0.0001);
}

typedef struct struct_small_c (*fn_struct_small_c_ret)();
EXPORTED void call_fn_struct_small_c_ret(char* ptr) {
    struct struct_small_c ret = ((fn_struct_small_c_ret)ptr)();
    assert(ret.a == -128);
    assert(ret.b == 65535);
}

typedef struct struct_small_d (*fn_struct_small_d_ret)();
EXPORTED void call_fn_struct_small_d_ret(char* ptr) {
    struct struct_small_d ret = ((fn_struct_small_d_ret)ptr)();
    assert(ret.a == 9223372036854775807U);
    assert(fabs(ret.b - 3.14159265359) < 0.0001);
}

typedef struct struct_big_a (*fn_struct_big_a_ret)();
EXPORTED void call_fn_struct_big_a_ret(char* ptr) {
    struct struct_big_a ret = ((fn_struct_big_a_ret)ptr)();
    assert(ret.a == 255);
    assert(ret.b == 18446744073709551615U);
    assert(ret.c == 9223372036854775807U);
}

