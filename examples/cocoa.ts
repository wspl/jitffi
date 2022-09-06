import { createFunction, CType } from ".."
import { loadModule } from "../lib/utils"

loadModule('/System/Library/Frameworks/AppKit.framework/AppKit')

const objc_getClass = createFunction({
  module: '/usr/lib/libobjc.A.dylib',
  name: 'objc_getClass',
  arguments: [CType.ptr],
  return: CType.ptr
})

const sel_registerName = createFunction({
  module: '/usr/lib/libobjc.A.dylib',
  name: 'sel_registerName',
  arguments: [CType.ptr],
  return: CType.ptr
})

const objc_msgSend = createFunction({
  module: '/usr/lib/libobjc.A.dylib',
  name: 'objc_msgSend',
  arguments: [CType.ptr, CType.ptr],
  return: CType.ptr
})

const objc_msgSend_ptr = createFunction({
  module: '/usr/lib/libobjc.A.dylib',
  name: 'objc_msgSend',
  arguments: [CType.ptr, CType.ptr, CType.ptr],
  return: CType.ptr
})

const sel_alloc = sel_registerName(Buffer.from('alloc\0').pointer())
console.log(sel_alloc)

const sel_init = sel_registerName(Buffer.from('init\0').pointer())
console.log(sel_init)

const NSAlert = objc_getClass(Buffer.from('NSAlert\0').pointer())
console.log(NSAlert)

const alert = objc_msgSend(objc_msgSend(NSAlert, sel_alloc), sel_init)

const NSString = objc_getClass(Buffer.from('NSString\0').pointer())
const sel_stringWithUTF8String = sel_registerName(Buffer.from('stringWithUTF8String:\0').pointer())
const text = objc_msgSend_ptr(NSString, sel_stringWithUTF8String, Buffer.from('Hello World!\0').pointer())

const sel_setMessageText = sel_registerName(Buffer.from('setMessageText:\0').pointer())
objc_msgSend_ptr(alert, sel_setMessageText, text)

const sel_runModal = sel_registerName(Buffer.from('runModal\0').pointer())
objc_msgSend(alert, sel_runModal)