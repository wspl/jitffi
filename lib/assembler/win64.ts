import { Reg64 } from "./x64"

export const ARG_REG_INT = [Reg64.rcx, Reg64.rdx, Reg64.r8, Reg64.r9]
export const ARG_REG_FLOAT = [Reg64.xmm0, Reg64.xmm1, Reg64.xmm2, Reg64.xmm3]
export const PRIMITIVE_SIZE = [1, 2, 4, 8]