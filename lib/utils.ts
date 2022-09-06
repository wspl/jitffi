import bindings from 'bindings'
const addon = bindings('jitffi')

export function getSymbol(module: string | undefined, name: string): Buffer {
  return addon.getSymbol(module, name)
}

export function loadModule(module: string | undefined): Buffer {
  return addon.loadModule(module)
}

export function cstr(s: string): Buffer {
  return Buffer.from(`${s}\0`).pointer()
}