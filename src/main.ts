import { assemble } from './assembler';
import { Computer } from './Computer';
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = /*html*/``;


const main = () => {

    // const program = new Uint8Array(16);
    // program.set([
    //     0b00000000, // MW a, imm8
    //     0b00001010, // 10
    //     0b00100000, // SW [imm16], a
    //     0xC0,       // [0xC000]
    //     0b00000000, // [0xC000]
    // ]);

    // const computer = new Computer();
    // try {
    //     computer.load(program)
    // } catch {
    //     computer.bruhbruh()
    // }

    assemble(`
        reset:
            pusha

            ; any score > 9? reset scores
            lw a, [(scores + 0)]
            lw b, [(scores + 1)]
            cmp a, MAX_SCORE
            mw h, f
            cmp b, MAX_SCORE
            and f, h
            jle [.no_score_reset]
            sw [(scores + 0)], 0
            sw [(scores + 1)], 0
    `);

}

main();
