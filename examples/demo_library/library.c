#include <stdio.h>

#if defined _WIN32
#define DLL_EXPORT __declspec(dllexport)
#else
#define DLL_EXPORT
#endif

struct Foo {
    int a;
    unsigned char b;
    char* c;
    int d;
    int e;
    unsigned char f;
};

DLL_EXPORT struct Foo GetFoo(char* ptr, int data) {
    struct Foo foo;
    foo.a = 12345678;
    foo.b = 254;
    foo.c = ptr;
    foo.d = data;
    foo.e = 12345678;
    foo.f = 254;
    return foo;
}

DLL_EXPORT int GetNum(char* ptr, int data) {
    // printf("internal get: %d\n", data);
    return data;
}

DLL_EXPORT char* GetPtr(char* ptr, int data) {
    return ptr;
}