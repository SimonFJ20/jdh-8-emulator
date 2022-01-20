
namespace Preprocessor {
    export type SourceFile = {
        path: string,
        content: string,
    };
    
    type Define = {
        type: 'define',
        name: string,
        value: string,
    };
    
    type Macro = {
        type: 'macro',
        name: string,
        value: string,
    };
    
    type Context = {
        idx: number,
        text: string,
        defines: Define[],
        macros: Macro[],
        files: SourceFile[]
    };
    
    const include = (ctx: Context) => {
        const match = ctx.text.slice(ctx.idx).match(/^@include\s+\"([a-zA-Z0-9,\.\-_\/]+)\"\s*$/m);
        if (!match) {
            const line = ctx.text.slice(ctx.idx).match(/^.*?$/m)!;
            throw new Error(`PreprocessorError: malformed include " ${line[0]} "`);
        }
        const file = ctx.files.find(file => file.path === match[0]);
        if (!file)
            throw new Error(`PreprocessorError: invalid include path "${match[0]}"`)
        ctx.text.replace(match[0], file.content);
    }

    const define = (ctx: Context) => {
        const match = ctx.text.slice(ctx.idx).match(/^@define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s((?:[^\n\\]|\\[\s\S])+)/);
        if (!match) {
            const line = ctx.text.slice(ctx.idx).match(/^.*?$/m)!;
            throw new Error(`PreprocessorError: malformed define " ${line[0]} "`);
        }
        ctx.defines.push({type: 'define', name: match[1], value: match[2]});
    }

    const macro = (ctx: Context) => {
        let content = '';
        for (let i = 0; i < ctx.text.length && !/^([a-zA-Z][a-zA-Z0-9])*:/.test(ctx.text.slice(ctx.idx + i)); i++) {
            content += ctx.text[ctx.idx + i];
        }
        const match = content.match(/^@macro\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:%([a-zA-Z0-9_]+)(?:\s*,\s*%([a-zA-Z0-9_]+))*)?\:/);
        throw new Error('not implemented')
    }

    export const preprocess = (text: string, files: SourceFile[]): string => {
        const ctx: Context = {
            idx: 0,
            text,
            defines: [],
            macros: [],
            files: [],
        };
        for (; ctx.idx < ctx.text.length; ctx.idx++) {
            if (/^@include/.test(ctx.text.slice(ctx.idx)))
                include(ctx);
            else if (/^@define/.test(ctx.text.slice(ctx.idx)))
                define(ctx);
            else if (/^@macro/.test(ctx.text.slice(ctx.idx)))
                macro(ctx);
        }
        return text;
    }
}

namespace Lexer {
    export type Rule = {
        name: string,
        match: RegExp,
    }
    
    export type Token = {
        type: string,
        value: string,
    }
    
    export const lex = (rules: Rule[], text: string): Token[] => {
        const tokens: Token[] = [];
        for (let i = 0; i < text.length; i++) {
            for (const rule of rules) {
                const match = text.slice(i).match(rule.match);
                if (match !== null) {
                    // console.log(text.slice(i, i + 10), match)
                    tokens.push({type: rule.name, value: match[1] ?? match[0]});
                    i += match[0].length - 1;
                    break;
                }
            }
        }
        return tokens;
    }
}

namespace Parser {
    type ParseContext = {
        idx: number,
        tokens: Lexer.Token[]
    };
    
    type Node = {
        type: string,
    };
    
    const parse = (tokens: Lexer.Token[]): Node[] => {
        const ctx: ParseContext = {tokens, idx: 0};
        const nodes: Node[] = [];
        while (ctx.idx < ctx.tokens.length)
            switch (ctx.tokens[ctx.idx].type) {
                
            }
        return nodes;
    }
}

const lexerRules = (): Lexer.Rule[] => ([
    // {name: 'newline',   match: /^\n/},
    {name: 'comma',     match: /^,/},
    {name: 'lparen',    match: /^\(/},
    {name: 'rparen',    match: /^\)/},
    {name: 'lbracket',  match: /^\[/},
    {name: 'rbracket',  match: /^\]/},
    {name: 'pad',       match: /^\+/},
    {name: 'minus',     match: /^\-/},
    {name: 'powerof',   match: /^\*{2}/},
    {name: 'multiply',  match: /^\*/},
    {name: 'divide',    match: /^\//},
    {name: 'modulus',   match: /^\%/},
    {name: 'and',       match: /^\&/},
    {name: 'or',        match: /^\|/},
    {name: 'xor',       match: /^\^/},
    {name: 'not',       match: /^\~/},
    {name: 'comment',   match: /^;.*?$/m},
    {name: 'decimal',   match: /^(0|(?:[1-9][0-9]*))/},
    {name: 'hexadec',   match: /^0x[0-0a-fA-F]+/},
    {name: 'binary',    match: /^0b[01]+/},
    {name: 'register',  match: /^[abcdflhz](?![a-zA-Z0-9])/},
    {name: 'label',     match: /^([a-zA-Z][a-zA-Z0-9])*:/},
    {name: 'name',      match: /^[a-zA-Z][a-zA-Z0-9]*/},
    {name: 'string',    match: /^"([^"\\]|\\[\s\S])*"/},
]);

export const assemble = (text: string): Uint8Array => {
    const tokens = Lexer.lex(lexerRules(), text).filter(token => token.type !== 'comment');
    console.log(tokens);
    return new Uint8Array();
}
