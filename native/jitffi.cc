#include <napi.h>
#include <stdio.h>
#include <string>
#ifdef _WIN32
#include <windows.h>
#else
#include <dlfcn.h>
#include <sys/mman.h>
#endif
#include <iostream>

Napi::Function MakeJSFunction(const Napi::CallbackInfo &info) {
  auto ptr = (napi_callback*)info[0].As<Napi::Uint8Array>().Data();
  auto name = info[1].As<Napi::String>().Utf8Value();

  napi_status status;
  napi_value f;
  status = napi_create_function(info.Env(), name.c_str(), name.length(), *ptr, nullptr, &f);

  return Napi::Function(info.Env(), f);
}

Napi::Buffer<char> LoadModule(const Napi::CallbackInfo &info) {
  auto result = Napi::Object::New(info.Env());
  
  if (info[0].IsUndefined() || info[0].IsNull()) {
#ifdef _WIN32
    auto handle = GetModuleHandleA(NULL);
#else
    auto handle = dlopen(nullptr, RTLD_LAZY);
#endif
    return Napi::Buffer<char>::Copy(info.Env(), (char*)&handle, 8);
  } else {
    auto module = info[0].As<Napi::String>().Utf8Value();
#ifdef _WIN32
    auto handle = LoadLibraryA(module.c_str());
#else
    auto handle = dlopen(module.c_str(), RTLD_LAZY);
#endif
    return Napi::Buffer<char>::Copy(info.Env(), (char*)&handle, 8);
  }
}

Napi::Buffer<char> GetSymbol(const Napi::CallbackInfo &info) {
  auto result = Napi::Object::New(info.Env());
  auto symbol = info[1].As<Napi::String>().Utf8Value();
  
  if (info[0].IsUndefined() || info[0].IsNull()) {
#ifdef _WIN32
    auto handle = GetModuleHandleA(NULL);
    auto addr = GetProcAddress(handle, symbol.c_str());
#else
    auto handle = dlopen(nullptr, RTLD_LAZY);
    auto addr = dlsym(handle, symbol.c_str());
#endif
    return Napi::Buffer<char>::Copy(info.Env(), (char*)&addr, 8);
  } else {
    auto module = info[0].As<Napi::String>().Utf8Value();
#ifdef _WIN32
    auto handle = LoadLibraryA(module.c_str());
    auto addr = GetProcAddress(handle, symbol.c_str());
#else
    auto handle = dlopen(module.c_str(), RTLD_LAZY);
    auto addr = dlsym(handle, symbol.c_str());
#endif
    return Napi::Buffer<char>::Copy(info.Env(), (char*)&addr, 8);
  }
}

void CallCallback(napi_env env, napi_ref ref) {
  napi_value fn;
  napi_get_reference_value(env, ref, &fn);
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  napi_call_function(env, undefined, fn, 0, 0, 0);
}

Napi::Buffer<char> GetCallbackReference(const Napi::CallbackInfo &info) {
  auto fn = info[0].As<Napi::Function>();
  napi_ref ref;
  napi_create_reference(info.Env(), fn, 1, &ref);
  return Napi::Buffer<char>::Copy(info.Env(), (char*)&ref, 8);
}

Napi::Buffer<char> GetBufferPointer(const Napi::CallbackInfo &info) {
  auto buf = info[0].As<Napi::Uint8Array>().Data();
  return Napi::Buffer<char>::Copy(info.Env(), (char*)&buf, 8);
}

Napi:: Buffer<char> GetExecutablePointer(const Napi::CallbackInfo &info) {
  auto buf = info[0].As<Napi::Uint8Array>();
#ifdef _WIN32
  SYSTEM_INFO system_info;
  GetSystemInfo(&system_info);
  auto const page_size = system_info.dwPageSize;
  auto const buffer = VirtualAlloc(nullptr, page_size, MEM_COMMIT, PAGE_READWRITE);
  std::memcpy(buffer, buf.Data(), buf.ByteLength());
  DWORD dummy;
  VirtualProtect(buffer, buf.ByteLength(), PAGE_EXECUTE_READ, &dummy);
  return Napi::Buffer<char>::Copy(info.Env(), (char*)&buffer, 8);
#else
  auto buffer = mmap(0, buf.ByteLength(),
                     PROT_READ | PROT_WRITE | PROT_EXEC,
                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
  memcpy(buffer, buf.Data(), buf.ByteLength());
#endif
  return Napi::Buffer<char>::Copy(info.Env(), (char*)&buffer, 8);
}

Napi::Buffer<char> GetPrintf(const Napi::CallbackInfo &info) {
  char* addr = (char*)printf;
  return Napi::Buffer<char>::Copy(info.Env(), (char*)&addr, 8);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("getSymbol", Napi::Function::New(env, GetSymbol));
  exports.Set("loadModule", Napi::Function::New(env, LoadModule));
  exports.Set("makeJSFunction", Napi::Function::New(env, MakeJSFunction));
  exports.Set("getCallbackReference", Napi::Function::New(env, GetCallbackReference));
  exports.Set("getBufferPointer", Napi::Function::New(env, GetBufferPointer));
  exports.Set("getExecutablePointer", Napi::Function::New(env, GetExecutablePointer));
  exports.Set("getPrintf", Napi::Function::New(env, GetPrintf));
  exports.Set("pointerSize", Napi::Number::New(env, sizeof(void*)));

  // Endian
  int n = 1;
  exports.Set("isLittleEndian", Napi::Boolean::New(env, *(char *)&n == 1));

  // Callback Context
  auto call_callback_ptr = (char*)&CallCallback;
  exports.Set("callCallbackPtr", Napi::Buffer<char>::Copy(env, (char*)&call_callback_ptr, 8));
  napi_env env_val = env;
  exports.Set("envPtr", Napi::Buffer<char>::Copy(env, (char*)&env_val, 8));

  // memcpy Address
  auto memcpy_ptr = (char*)&memcpy;
  exports.Set("memcpyPtr", Napi::Buffer<char>::Copy(env, (char*)&memcpy_ptr, 8));

  return exports;
}

NODE_API_MODULE(jitffi, Init)