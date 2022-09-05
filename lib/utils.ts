import bindings from 'bindings'
const addon = bindings('jitffi')

export function getSymbol(module: string | undefined, name: string): Buffer {
  return addon.getSymbol(module, name)
}