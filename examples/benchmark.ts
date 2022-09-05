import { createFunction, nullptr, CType, defineStruct } from ".."

const GetNum = createFunction({
  module: 'examples/demo_library/liblibrary.dylib',
  name: 'GetNum',
  arguments: [CType.ptr, CType.i32],
  return: CType.i32
})
console.time('aaa')
GetNum(nullptr, 123467895)
console.timeEnd('aaa')


const GetPtr = createFunction({
  module: 'examples/demo_library/liblibrary.dylib',
  name: 'GetPtr',
  arguments: [CType.ptr, CType.i32],
  return: CType.ptr
})
console.log('GetPtr', GetPtr(Buffer.from([1,2,3,4,5,6,7,8]), 123467895))

const Bar = defineStruct({
  barItem: CType.ptr
})

const Foo = defineStruct({
  a: CType.i32,
  b: CType.u8,
  c: Bar,
  d: CType.i32,
  e: CType.i32,
  f: CType.u8,
})

const foo = new Foo()

const GetFoo = createFunction({
  module: 'examples/demo_library/liblibrary.dylib',
  name: 'GetFoo',
  arguments: [CType.ptr, CType.i32],
  return: Foo
})

const p = Buffer.from([1,2,3,4,5,6,7,8])
console.log(p)
const ret = GetFoo(p, 12346789)
console.log(ret.a, ret.b, ret.c, ret.d, ret.e, ret.f)

// console.time('a')
// for (let i = 0; i < 1000000; i++) {
//   GetPtr(p, 123467895)
// }
// console.timeEnd('a')

// console.time('a')
// for (let i = 0; i < 1000000; i++) {
//   // PostMessageA(nullptr, 0, nullptr, nullptr)
//   // Buffer.alloc(128)
// }
// console.timeEnd('a')