import { createCallbackCreator, createFunction, nullptr, CType, defineStruct } from ".."

const RegisterClassA = createFunction({
  module: 'USER32',
  name: 'RegisterClassA',
  arguments: [CType.ptr],
  return: CType.u16
})

const CreateWindowExA = createFunction({
  module: 'USER32',
  name: 'CreateWindowExA',
  arguments: [
    CType.u32,
    CType.ptr,
    CType.ptr,
    CType.u32,
    CType.i32,
    CType.i32,
    CType.i32,
    CType.i32,
    CType.ptr,
    CType.ptr,
    CType.ptr,
    CType.ptr,
  ],
  return: CType.ptr
})

const ShowWindow = createFunction({
  module: 'USER32',
  name: 'ShowWindow',
  arguments: [CType.ptr, CType.u32],
  return: CType.i32
})

const GetMessageA = createFunction({
  module: 'USER32',
  name: 'GetMessageA',
  arguments: [CType.ptr, CType.ptr, CType.u32, CType.u32],
  return: CType.i32
})

const TranslateMessage = createFunction({
  module: 'USER32',
  name: 'TranslateMessage',
  arguments: [CType.ptr],
  return: CType.i32
})

const DispatchMessageA = createFunction({
  module: 'USER32',
  name: 'DispatchMessageA',
  arguments: [CType.ptr],
  return: CType.ptr
})

const DefWindowProcA = createFunction({
  module: 'USER32',
  name: 'DefWindowProcA',
  arguments: [CType.ptr, CType.u32, CType.ptr, CType.ptr],
  return: CType.ptr
})

const WNDCLASSA = defineStruct({
  style: CType.u32,
  lpfnWndProc: CType.ptr,
  cbClsExtra: CType.i32,
  cbWndExtra: CType.i32,
  hInstance: CType.ptr,
  hIcon: CType.ptr,
  hCursor: CType.ptr,
  hbrBackground: CType.ptr,
  lpszMenuName: CType.ptr,
  lpszClassName: CType.ptr,
})

const POINT = defineStruct({
  x: CType.i32,
  y: CType.i32,
})

const MSG = defineStruct({
  hwnd: CType.ptr,
  message: CType.u32,
  wParam: CType.ptr,
  lParam: CType.ptr,
  time: CType.u32,
  pt: POINT,
})

const GetModuleHandleA = createFunction({
  module: 'KERNEL32',
  name: 'GetModuleHandleA',
  arguments: [CType.ptr],
  return: CType.ptr
})


const WS_CAPTION = 0x00C00000
const WS_MAXIMIZEBOX = 0x00010000
const WS_MINIMIZEBOX = 0x00020000
const WS_OVERLAPPED = 0x00000000
const WS_POPUP = 0x80000000
const WS_THICKFRAME = 0x00040000
const WS_SYSMENU = 0x00080000
const WS_OVERLAPPEDWINDOW = WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU
  | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX

const CW_USEDEFAULT = 1 << 31

const SW_SHOW = 5;

const WNDPROC = createCallbackCreator({
  name: 'WNDPROC',
  arguments: [
    CType.ptr,
    CType.u32,
    CType.ptr,
    CType.ptr,
  ],
  return: CType.ptr
})


const hInstance = GetModuleHandleA(Buffer.alloc(8))

const wndProc = WNDPROC.create((hwnd: any, msg: any, wParam: any, lParam: any) => {
  const a = DefWindowProcA(hwnd, msg, wParam, lParam);
  return a
})

const windowClass = new WNDCLASSA({
  // lpfnWndProc: getSymbol('USER32', 'DefWindowProcA'),
  lpfnWndProc: wndProc,
  hInstance: hInstance,
  lpszClassName: Buffer.from('Sample Window Class\0').pointer()
})

RegisterClassA(windowClass.pointer())

const hwnd = CreateWindowExA(
    0,
    Buffer.from('Sample Window Class\0').pointer(),
    Buffer.from('Learn to Program Windows\0').pointer(),
    WS_OVERLAPPEDWINDOW,
    CW_USEDEFAULT,
    CW_USEDEFAULT,
    CW_USEDEFAULT,
    CW_USEDEFAULT,
    nullptr,
    nullptr,
    nullptr,
    nullptr
)


ShowWindow(hwnd, SW_SHOW);

const msg = new MSG();
while (GetMessageA(msg.pointer(), nullptr, 0, 0) > 0) {
  TranslateMessage(msg.pointer())
  DispatchMessageA(msg.pointer())
}