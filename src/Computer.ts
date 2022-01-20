
const enum Locations {
    MB  = 0xFFFA,
    SP  = 0xFFFC,
    SPH = 0xFFFC,
    SPL = 0xFFFD,
    PC  = 0xFFFE,
    PCH = 0xFFFE,
    PCL = 0xFFFF,
}

const enum Registers {
    A, B, C, D, L, H, Z, F
}

const enum Flags {
    LESS, EQUAL, CARRY, BORROW
}

const enum StatusRegisters {
    UNUSED, ERROR, POWER, HALT
}

export class Computer {

    private memory: Uint8Array;
    private registers: Uint8Array;
    private statusRegisters: boolean[];

    constructor () {
        this.memory = new Uint8Array(2**16).fill(0);
        this.registers = new Uint8Array(2**3).fill(0);
        this.statusRegisters = new Array(4).fill(false);
        
        this.memory[Locations.MB] = 0;
        this.memory[Locations.SPH] = 0xFE;
        this.memory[Locations.SPL] = 0xFF;
        this.memory[Locations.PCH] = 0;
        this.memory[Locations.PCL] = 0;
    }

    public load(program: Uint8Array, location = 0) {
        this.memory.set(program, location);

        this.statusRegisters.fill(false);
        this.statusRegisters[StatusRegisters.POWER] = true;
        while (this.statusRegisters[StatusRegisters.POWER]
            && !this.statusRegisters[StatusRegisters.ERROR]
            && !this.statusRegisters[StatusRegisters.HALT])
            this.executeInstruction();
    }

    public bruhbruh() {
        console.log(this.registers[Registers.A], this.memory[0xC000]);

    }

    private executeInstruction() {
        const label = instructionLabel(this.current());
        switch (label) {
            case 0x0: return this.execinst_MW();
            case 0x1: return this.execinst_LW();
            case 0x2: return this.execinst_SW();
            case 0x3: return this.execinst_PUSH();
            case 0x4: return this.execinst_POP();
            case 0x5: return this.execinst_LDA();
            case 0x6: return this.execinst_JNZ();
            case 0x7: return this.execinst_INB();
            case 0x8: return this.execinst_OUTB();
            case 0x9: return this.execinst_ADD();
            case 0xA: return this.execinst_ADC();
            case 0xB: return this.execinst_AND();
            case 0xC: return this.execinst_OR();
            case 0xD: return this.execinst_NOR();
            case 0xE: return this.execinst_CMP();
            case 0xF: return this.execinst_SBB();
        }
    }

    private execinst_MW() {
        if (operandIsRegister(this.current())) {
            const dest = operandRegisterLocation(this.current());
            this.incrementPC();
            const src = operandRegisterLocation(this.current());
            this.registers[dest] = this.registers[src];
        } else {
            const dest = operandRegisterLocation(this.current());
            this.incrementPC();
            this.registers[dest] = this.current();
        }
        this.incrementPC();
    }

    private execinst_LW() {
        if (operandIsRegister(this.current())) {
            const dest = operandRegisterLocation(this.current());
            const srcH = (this.registers[Registers.H]) << 8;
            const srcL =  this.registers[Registers.L]
            this.registers[dest] = this.memory[srcH + srcL];
        } else {
            const dest = operandRegisterLocation(this.current());
            this.incrementPC();
            const srcH = this.current() << 8;
            this.incrementPC();
            const srcL = this.current();
            this.registers[dest] = this.memory[srcH + srcL];
        }
        this.incrementPC();
    }
    
    private execinst_SW() {
        const src = operandRegisterLocation(this.current());
        if (operandIsRegister(this.current())) {
            const destH = (this.registers[Registers.H]) << 8;
            const destL =  this.registers[Registers.L]
            this.memory[destH + destL] = this.registers[src];
        } else {
            this.incrementPC();
            const destH = this.current() << 8;
            this.incrementPC();
            const destL = this.current();
            this.memory[destH + destL] = this.registers[src];
        }
        this.incrementPC();
        throw new Error('bruh')
    }
    
    private execinst_PUSH() {
        const src = this.registerOrImmediate();
        const destH = this.memory[Locations.PCH] << 8;
        const destL = this.memory[Locations.PCL];
        this.memory[destH + destL] = src;
        if (this.memory[Locations.PCL] === 0)
            this.memory[Locations.PCH]--;
        this.memory[Locations.PCL]--;
        this.incrementPC();
    }
    
    private execinst_POP() {
        const dest = operandRegisterLocation(this.current());
        this.memory[Locations.PCL]++;
        if (this.memory[Locations.PCL] === 0)
            this.memory[Locations.PCH]++;
        const destH = this.memory[Locations.PCH] << 8;
        const destL = this.memory[Locations.PCL];
        this.registers[dest] = this.memory[destH + destL];
        this.incrementPC();
    }
    
    private execinst_LDA() {
        this.incrementPC();
        const destH = this.current() << 8;
        this.incrementPC();
        const destL = this.current();
        this.registers[Registers.H] = destH;
        this.registers[Registers.L] = destL;
        this.incrementPC();
    }
    
    private execinst_JNZ() {
        const src = this.registerOrImmediate();
        if (src !== 0) {
            this.memory[Locations.PCH] = this.registers[Registers.H];
            this.memory[Locations.PCL] = this.registers[Registers.L];
        }
    }
    
    private execinst_INB() {

    }
    
    private execinst_OUTB() {

    }
    
    private execinst_ADD() {
        const dest = operandRegisterLocation(this.current());
        const src = this.registerOrImmediateAtNext();
        this.loadFlagsRegister(this.registers[dest], src);
        this.registers[dest] = (this.registers[dest] + src) % 0x100;
        this.incrementPC();
    }
    
    private execinst_ADC() {
        const dest = operandRegisterLocation(this.current());
        const src = this.registerOrImmediateAtNext();
        const carry = (this.registers[Registers.F] >>> Flags.CARRY) & 1 ? 1 : 0;
        this.loadFlagsRegister(this.registers[dest], src);
        this.registers[dest] = (this.registers[dest] + src + carry) % 0x100;
        this.incrementPC();
    }
    
    private execinst_AND() {
        const dest = operandRegisterLocation(this.current());
        const src = this.registerOrImmediateAtNext();
        this.registers[dest] = this.registers[dest] & src;
        this.incrementPC();
    }
    
    private execinst_OR() {
        const dest = operandRegisterLocation(this.current());
        const src = this.registerOrImmediateAtNext();
        this.registers[dest] = this.registers[dest] | src;
        this.incrementPC();
    }
    
    private execinst_NOR() {
        const dest = operandRegisterLocation(this.current());
        const src = this.registerOrImmediateAtNext();
        this.registers[dest] = ~(this.registers[dest] | src);
        this.incrementPC();
    }
    
    private execinst_CMP() {
        const dest = operandRegisterLocation(this.current());
        const src = this.registerOrImmediateAtNext();
        this.loadFlagsRegister(this.registers[dest], src);
        this.incrementPC();
    }
    
    private execinst_SBB() {
        const dest = operandRegisterLocation(this.current());
        const src = this.registerOrImmediateAtNext();
        const borrow = (this.registers[Registers.F] >>> Flags.BORROW) & 1 ? 1 : 0;
        this.loadFlagsRegister(this.registers[dest], src);
        this.registers[dest] = ((this.registers[dest] + borrow) - src) % 0x100;
        this.incrementPC();
    }

    private current() {
        const h = this.memory[Locations.PCH] << 8;
        const l = this.memory[Locations.PCL];
        return this.memory[h + l];
    }

    private incrementPC() {
        this.memory[Locations.PCL]++;
        if (this.memory[Locations.PCL] === 0)
            this.memory[Locations.PCH]++;
    }

    private registerOrImmediate() {
        if (operandIsRegister(this.current())) {
            return operandRegisterLocation(this.current());
        } else {
            this.incrementPC();
            return this.current();
        }
    }

    private registerOrImmediateAtNext() {
        if (operandIsRegister(this.current())) {
            return operandRegisterLocation(this.current());
        } else {
            this.incrementPC();
            return this.current();
        }
    }

    private loadFlagsRegister(a: number, b: number) {
        this.registers[Registers.F] = 0;
        this.registers[Registers.F] |= ((a < b ? 1 : 0) << Flags.LESS);
        this.registers[Registers.F] |= ((a == b ? 1 : 0) << Flags.EQUAL);
        this.registers[Registers.F] |= ((a + b > 0xFF ? 1 : 0) << Flags.EQUAL);
        this.registers[Registers.F] |= ((a < b ? 1 : 0) << Flags.EQUAL);
    }

}

const instructionLabel = (instruction: number) => {
    return instruction >>> 4;
}

const operandIsRegister = (instruction: number): boolean => {
    return (instruction & 0b00001000) !== 0;
}

const operandRegisterLocation = (instruction: number): Registers => {
    return instruction & 0b00000111;
}
