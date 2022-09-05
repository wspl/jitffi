#include <stdint.h>

struct struct_small_a {
    int32_t a;
};

struct struct_small_b {
    double a;
};

struct struct_small_c {
    int8_t a;
    uint16_t b;
};

struct struct_small_d {
    int64_t a;
    float b;
};

struct struct_big_a {
    uint8_t a;
    uint64_t b;
    int64_t c;
};